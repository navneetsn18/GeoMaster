package com.geomaster.service;

import com.geomaster.dto.response.LeaderboardEntryDto;
import com.geomaster.model.GameSession;
import com.geomaster.model.User;
import com.geomaster.model.enums.MapType;
import com.geomaster.repository.FriendshipRepository;
import com.geomaster.repository.GameSessionRepository;
import com.geomaster.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final GameSessionRepository gameSessionRepository;
    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(MapType mapType, String period, int limit) {
        Instant since = resolvePeriodStart(period);
        List<GameSession> sessions = since == null
                ? gameSessionRepository.findCompletedByMapTypeAllTime(mapType.name(), PageRequest.of(0, limit))
                : gameSessionRepository.findCompletedByMapTypeSince(mapType.name(), since, PageRequest.of(0, limit));
        return toLeaderboardEntries(sessions);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getFollowingLeaderboard(String userEmail, MapType mapType, String period) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<String> friendIds = friendshipRepository.findFriendIdsByUserId(user.getId());
        List<String> allIds = new ArrayList<>(friendIds);
        allIds.add(user.getId());

        Instant since = resolvePeriodStart(period);
        List<GameSession> sessions = since == null
                ? gameSessionRepository.findCompletedByUserIdsAndMapTypeAllTime(allIds, mapType.name(), PageRequest.of(0, 50))
                : gameSessionRepository.findCompletedByUserIdsAndMapTypeSince(allIds, mapType.name(), since, PageRequest.of(0, 50));
        return toLeaderboardEntries(sessions);
    }

    private List<LeaderboardEntryDto> toLeaderboardEntries(List<GameSession> sessions) {
        if (sessions.isEmpty()) return List.of();

        List<String> userIds = sessions.stream().map(GameSession::getUserId).distinct().toList();
        Map<String, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return IntStream.range(0, sessions.size())
                .mapToObj(i -> {
                    GameSession s = sessions.get(i);
                    User u = userMap.get(s.getUserId());
                    double accuracy = s.getTotalCount() > 0
                            ? (double) s.getCorrectCount() / s.getTotalCount() * 100.0
                            : 0.0;
                    return LeaderboardEntryDto.builder()
                            .rank(i + 1)
                            .userId(s.getUserId())
                            .username(u != null ? u.getUsername() : "Unknown")
                            .score(s.getFinalScore())
                            .correctCount(s.getCorrectCount())
                            .accuracy(accuracy)
                            .date(s.getCompletedAt())
                            .build();
                })
                .toList();
    }

    private Instant resolvePeriodStart(String period) {
        if (period == null) return null;
        return switch (period.toUpperCase()) {
            case "TODAY", "DAILY"       -> Instant.now().minus(1, ChronoUnit.DAYS);
            case "THIS_WEEK", "WEEKLY"  -> Instant.now().minus(7, ChronoUnit.DAYS);
            default                     -> null; // ALL_TIME
        };
    }
}
