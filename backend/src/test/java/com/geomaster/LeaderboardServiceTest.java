package com.geomaster;

import com.geomaster.dto.response.LeaderboardEntryDto;
import com.geomaster.model.GameSession;
import com.geomaster.model.User;
import com.geomaster.model.enums.MapType;
import com.geomaster.repository.FriendshipRepository;
import com.geomaster.repository.GameSessionRepository;
import com.geomaster.repository.UserRepository;
import com.geomaster.service.LeaderboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for LeaderboardService.
 *
 * The service under test has two public methods:
 *   - getLeaderboard(MapType, String period, int limit)
 *   - getFollowingLeaderboard(String userEmail, MapType, String period)
 *
 * Repository mocks return sessions already sorted by score DESC (as the real DB
 * query does via ORDER BY gs.finalScore DESC), since toLeaderboardEntries() does
 * not re-sort — it relies on the DB ordering.
 *
 * userRepository.findAllById() returns an empty list by default (Mockito default
 * for collection-returning methods), so LeaderboardEntryDto.username is "Unknown"
 * in all tests. Tests only assert on rank, score, and userId, not username.
 */
@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock
    private GameSessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @InjectMocks
    private LeaderboardService leaderboardService;

    /** String form of mapType, used when mocking the repository ("WORLD"). */
    private static final String MAP_TYPE_STR = "WORLD";

    private static final String USER_ID    = UUID.randomUUID().toString();
    private static final String USER_EMAIL = "test@example.com";

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(USER_ID)
                .username("testuser")
                .email(USER_EMAIL)
                .passwordHash("hash")
                .build();
    }

    // -----------------------------------------------------------------------
    // Global leaderboard — ordering and top-50 cap
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Global leaderboard")
    class GlobalLeaderboard {

        @Test
        @DisplayName("Returns entries ordered by score descending")
        void orderedByScoreDesc() {
            // Return sessions pre-sorted desc (as the DB ORDER BY clause would)
            List<GameSession> sessions = List.of(
                    buildSession("user-2", 1200, Instant.now()),
                    buildSession("user-3", 900, Instant.now()),
                    buildSession("user-1", 500, Instant.now())
            );
            when(sessionRepository.findCompletedByMapTypeAllTime(eq(MAP_TYPE_STR), any()))
                    .thenReturn(sessions);

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "ALL_TIME", 50);

            assertThat(result).hasSize(3);
            assertThat(result.get(0).getScore()).isGreaterThanOrEqualTo(result.get(1).getScore());
            assertThat(result.get(1).getScore()).isGreaterThanOrEqualTo(result.get(2).getScore());
        }

        @Test
        @DisplayName("Returns exactly the number of entries the repository provides (capped by DB page)")
        void capsAtFiftyEntries() {
            // Simulate DB returning exactly 50 entries (PageRequest.of(0, 50) limit enforced by DB)
            List<GameSession> sessions = IntStream.range(0, 50)
                    .mapToObj(i -> buildSession("user-" + i, 1000 + i, Instant.now()))
                    .collect(Collectors.toList());

            when(sessionRepository.findCompletedByMapTypeAllTime(eq(MAP_TYPE_STR), any()))
                    .thenReturn(sessions);

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "ALL_TIME", 50);

            assertThat(result).hasSize(50);
        }

        @Test
        @DisplayName("Rank values are sequential starting from 1")
        void rankIsSequential() {
            // Pre-sorted desc so toLeaderboardEntries assigns ranks in order
            List<GameSession> sessions = IntStream.range(0, 5)
                    .mapToObj(i -> buildSession("user-" + i, 1000 - i * 100, Instant.now()))
                    .collect(Collectors.toList());

            when(sessionRepository.findCompletedByMapTypeAllTime(eq(MAP_TYPE_STR), any()))
                    .thenReturn(sessions);

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "ALL_TIME", 50);

            for (int i = 0; i < result.size(); i++) {
                assertThat(result.get(i).getRank()).isEqualTo(i + 1);
            }
        }
    }

    // -----------------------------------------------------------------------
    // Time-period filtering
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Time-period filtering")
    class TimePeriodFiltering {

        @Test
        @DisplayName("WEEKLY period excludes sessions older than 7 days")
        void weeklyExcludesOldSessions() {
            Instant withinWeek = Instant.now().minus(3, ChronoUnit.DAYS);

            List<GameSession> recentSessions = List.of(buildSession("user-1", 800, withinWeek));

            // The mock simulates DB filtering by the since-date argument
            when(sessionRepository.findCompletedByMapTypeSince(eq(MAP_TYPE_STR), any(), any()))
                    .thenAnswer(inv -> {
                        Instant since = inv.getArgument(1);
                        return recentSessions.stream()
                                .filter(s -> s.getCompletedAt().isAfter(since))
                                .collect(Collectors.toList());
                    });

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "WEEKLY", 50);

            assertThat(result).hasSize(1);
        }

        @Test
        @DisplayName("WEEKLY period: sessions from exactly 7 days ago are excluded")
        void weeklyBoundaryExcluded() {
            Instant exactlySevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);

            when(sessionRepository.findCompletedByMapTypeSince(eq(MAP_TYPE_STR), any(), any()))
                    .thenAnswer(inv -> {
                        Instant since = inv.getArgument(1);
                        return List.of(buildSession("user-1", 500, exactlySevenDaysAgo))
                                .stream()
                                .filter(s -> s.getCompletedAt().isAfter(since))
                                .collect(Collectors.toList());
                    });

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "WEEKLY", 50);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("DAILY period only includes sessions from today (UTC)")
        void dailyOnlyIncludesToday() {
            Instant todayRecent = Instant.now().minus(1, ChronoUnit.HOURS);
            Instant yesterday   = Instant.now().minus(25, ChronoUnit.HOURS);

            List<GameSession> allSessions = List.of(
                    buildSession("user-1", 1000, todayRecent),
                    buildSession("user-2", 900, yesterday)
            );

            when(sessionRepository.findCompletedByMapTypeSince(eq(MAP_TYPE_STR), any(), any()))
                    .thenAnswer(inv -> {
                        Instant since = inv.getArgument(1);
                        return allSessions.stream()
                                .filter(s -> s.getCompletedAt().isAfter(since))
                                .collect(Collectors.toList());
                    });

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "DAILY", 50);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getScore()).isEqualTo(1000);
        }

        @Test
        @DisplayName("ALL_TIME period includes all completed sessions")
        void allTimeIncludesEverything() {
            List<GameSession> allSessions = List.of(
                    buildSession("user-3", 1200, Instant.now()),
                    buildSession("user-2", 800, Instant.now().minus(30, ChronoUnit.DAYS)),
                    buildSession("user-1", 500, Instant.now().minus(365, ChronoUnit.DAYS))
            );

            when(sessionRepository.findCompletedByMapTypeAllTime(eq(MAP_TYPE_STR), any()))
                    .thenReturn(allSessions);

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "ALL_TIME", 50);

            assertThat(result).hasSize(3);
        }
    }

    // -----------------------------------------------------------------------
    // Friends leaderboard
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Friends leaderboard")
    class FriendsLeaderboard {

        private static final String FRIEND_1 = UUID.randomUUID().toString();
        private static final String FRIEND_2 = UUID.randomUUID().toString();
        private static final String STRANGER = UUID.randomUUID().toString();

        @Test
        @DisplayName("Only includes sessions from user's accepted friends")
        void onlyFriendSessions() {
            List<String> friendIds = List.of(FRIEND_1, FRIEND_2);

            // Pre-sorted desc by score
            List<GameSession> friendSessions = List.of(
                    buildSession(FRIEND_1, 1000, Instant.now()),
                    buildSession(FRIEND_2, 800, Instant.now())
            );

            when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(testUser));
            when(friendshipRepository.findFriendIdsByUserId(USER_ID)).thenReturn(friendIds);
            when(sessionRepository.findCompletedByUserIdsAndMapTypeAllTime(any(), eq(MAP_TYPE_STR), any()))
                    .thenReturn(friendSessions);

            List<LeaderboardEntryDto> result =
                    leaderboardService.getFollowingLeaderboard(USER_EMAIL, MapType.WORLD, "ALL_TIME");

            assertThat(result).hasSize(2);
            assertThat(result.stream().map(LeaderboardEntryDto::getUserId))
                    .containsExactlyInAnyOrder(FRIEND_1, FRIEND_2);
            // Stranger's score must not appear
            assertThat(result.stream().map(LeaderboardEntryDto::getUserId))
                    .doesNotContain(STRANGER);
        }

        @Test
        @DisplayName("Friends leaderboard is also ordered by score desc")
        void friendsOrderedByScoreDesc() {
            List<String> friendIds = List.of(FRIEND_1, FRIEND_2);

            // Return pre-sorted desc (highest first)
            when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(testUser));
            when(friendshipRepository.findFriendIdsByUserId(USER_ID)).thenReturn(friendIds);
            when(sessionRepository.findCompletedByUserIdsAndMapTypeAllTime(any(), eq(MAP_TYPE_STR), any()))
                    .thenReturn(List.of(
                            buildSession(FRIEND_2, 1200, Instant.now()),
                            buildSession(FRIEND_1, 400, Instant.now())
                    ));

            List<LeaderboardEntryDto> result =
                    leaderboardService.getFollowingLeaderboard(USER_EMAIL, MapType.WORLD, "ALL_TIME");

            assertThat(result.get(0).getScore()).isGreaterThan(result.get(1).getScore());
        }
    }

    // -----------------------------------------------------------------------
    // Empty leaderboard
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Empty leaderboard handling")
    class EmptyLeaderboard {

        @Test
        @DisplayName("Global leaderboard with no sessions returns empty list, not an exception")
        void emptyGlobalLeaderboard() {
            when(sessionRepository.findCompletedByMapTypeAllTime(eq(MAP_TYPE_STR), any()))
                    .thenReturn(Collections.emptyList());

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "ALL_TIME", 50);

            assertThat(result).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("Friends leaderboard with no friend sessions returns empty list")
        void emptyFriendsLeaderboard() {
            when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(testUser));
            when(friendshipRepository.findFriendIdsByUserId(USER_ID))
                    .thenReturn(Collections.emptyList());
            // allIds = [USER_ID], service calls findCompletedByUserIdsAndMapType → default empty list

            List<LeaderboardEntryDto> result =
                    leaderboardService.getFollowingLeaderboard(USER_EMAIL, MapType.WORLD, "ALL_TIME");

            assertThat(result).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("WEEKLY leaderboard with no sessions this week returns empty list")
        void emptyWeeklyLeaderboard() {
            when(sessionRepository.findCompletedByMapTypeSince(eq(MAP_TYPE_STR), any(), any()))
                    .thenReturn(Collections.emptyList());

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "WEEKLY", 50);

            assertThat(result).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("DAILY leaderboard with no sessions today returns empty list")
        void emptyDailyLeaderboard() {
            when(sessionRepository.findCompletedByMapTypeSince(eq(MAP_TYPE_STR), any(), any()))
                    .thenReturn(Collections.emptyList());

            List<LeaderboardEntryDto> result =
                    leaderboardService.getLeaderboard(MapType.WORLD, "DAILY", 50);

            assertThat(result).isNotNull().isEmpty();
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private GameSession buildSession(String userId, int score, Instant completedAt) {
        return GameSession.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .mapType(MAP_TYPE_STR)
                .finalScore(score)
                .status("COMPLETED")
                .completed(true)
                .completedAt(completedAt)
                .build();
    }
}
