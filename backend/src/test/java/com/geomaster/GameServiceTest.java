package com.geomaster;

import com.geomaster.dto.request.GuessRequest;
import com.geomaster.dto.response.GuessResultDto;
import com.geomaster.model.GameSession;
import com.geomaster.model.GuessRecord;
import com.geomaster.model.User;
import com.geomaster.repository.GameSessionRepository;
import com.geomaster.repository.GuessRecordRepository;
import com.geomaster.repository.UserRepository;
import com.geomaster.service.CountryDataService;
import com.geomaster.service.GameService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GameService.
 *
 * Focuses on the scoring algorithm (calculatePoints — package-private) and
 * streak state management via submitGuess (with mocked repositories).
 *
 * Scoring algorithm (from implementation):
 *   correctAnswer:
 *     base         = 100
 *     secondsElapsed = (timeTakenMs - 3000) / 1000   // integer division
 *     timeBonus    = max(0, 50 - max(0, secondsElapsed))
 *     multiplier   = currentStreak >= 20 ? 3.0
 *                  : currentStreak >= 10 ? 2.0
 *                  : currentStreak >= 5  ? 1.5
 *                  : 1.0
 *     points       = (int)((base + timeBonus) * multiplier)  // Java truncation = floor for positive
 *
 *   wrongAnswer:
 *     points = 0
 *     streak reset to 0
 *
 * NOTE: currentStreak passed to calculatePoints is session.getCurrentStreak() BEFORE
 * the current guess is applied (i.e., the streak built by previous correct guesses).
 */
@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameSessionRepository gameSessionRepository;

    @Mock
    private GuessRecordRepository guessRecordRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CountryDataService countryDataService;

    @InjectMocks
    private GameService gameService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID().toString())
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hash")
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(guessRecordRepository.save(any(GuessRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // -----------------------------------------------------------------------
    // calculatePoints — direct tests (method is package-private)
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("calculatePoints — correct answers, no streak (multiplier = 1.0)")
    class CorrectAnswerScoring {

        @Test
        @DisplayName("Fast answer (1000 ms, streak=0) → 150 pts (100 base + 50 bonus, 1x)")
        void correctFastNoStreak() {
            // (1000-3000)/1000 = -2 → max(0,-2)=0 → timeBonus=50 → (100+50)*1.0=150
            assertThat(gameService.calculatePoints(true, 1000, 0)).isEqualTo(150);
        }

        @Test
        @DisplayName("Answer at exactly 3000 ms, streak=0 → 150 pts (full time bonus)")
        void correctAtBonusBoundaryNoStreak() {
            // (3000-3000)/1000 = 0 → max(0,0)=0 → timeBonus=50 → (100+50)*1.0=150
            assertThat(gameService.calculatePoints(true, 3000, 0)).isEqualTo(150);
        }

        @Test
        @DisplayName("Answer at 4000 ms, streak=0 → 149 pts (one second of penalty)")
        void correctAt4SecNoStreak() {
            // (4000-3000)/1000 = 1 → timeBonus=50-1=49 → (100+49)*1.0=149
            assertThat(gameService.calculatePoints(true, 4000, 0)).isEqualTo(149);
        }

        @Test
        @DisplayName("Slow answer (60000 ms, streak=0) → 100 pts (no time bonus)")
        void correctSlowNoStreak() {
            // (60000-3000)/1000 = 57 → max(0,50-57)=0 → (100+0)*1.0=100
            assertThat(gameService.calculatePoints(true, 60000, 0)).isEqualTo(100);
        }

        @Test
        @DisplayName("Answer at 53000 ms → 100 pts (time bonus hits zero exactly here)")
        void correctAtTimeBonusCutoff() {
            // (53000-3000)/1000 = 50 → 50-50=0 → (100+0)*1.0=100
            assertThat(gameService.calculatePoints(true, 53000, 0)).isEqualTo(100);
        }

        @Test
        @DisplayName("Answer at 52999 ms → 101 pts (1 pt bonus remains)")
        void correctJustBelowTimeCutoff() {
            // (52999-3000)/1000 = 49999/1000 = 49 (integer division) → timeBonus=50-49=1 → 101
            assertThat(gameService.calculatePoints(true, 52999, 0)).isEqualTo(101);
        }

        @Test
        @DisplayName("Answer at 2999 ms → 150 pts (sub-3s answer still gets full bonus)")
        void correctSubThreeSecond() {
            // (2999-3000)/1000 = -1/1000 = 0 in Java integer division (truncation, not floor!) → max(0,0)=0 → timeBonus=50
            assertThat(gameService.calculatePoints(true, 2999, 0)).isEqualTo(150);
        }
    }

    @Nested
    @DisplayName("calculatePoints — streak multiplier tiers")
    class StreakMultiplierScoring {

        @Test
        @DisplayName("streak=0 → 1.0x → 150 pts (fast answer)")
        void streak0Is1x() {
            assertThat(gameService.calculatePoints(true, 1000, 0)).isEqualTo(150);
        }

        @Test
        @DisplayName("streak=4 → 1.0x → 150 pts (boundary: one below 1.5x)")
        void streak4Is1x() {
            assertThat(gameService.calculatePoints(true, 1000, 4)).isEqualTo(150);
        }

        @Test
        @DisplayName("streak=5 → 1.5x → 225 pts")
        void streak5Is15x() {
            // (int)((100+50)*1.5) = (int)(225.0) = 225
            assertThat(gameService.calculatePoints(true, 1000, 5)).isEqualTo(225);
        }

        @Test
        @DisplayName("streak=9 → 1.5x → 225 pts (boundary: one below 2.0x)")
        void streak9Is15x() {
            assertThat(gameService.calculatePoints(true, 1000, 9)).isEqualTo(225);
        }

        @Test
        @DisplayName("streak=10 → 2.0x → 300 pts")
        void streak10Is2x() {
            // (int)((100+50)*2.0) = 300
            assertThat(gameService.calculatePoints(true, 1000, 10)).isEqualTo(300);
        }

        @Test
        @DisplayName("streak=19 → 2.0x → 300 pts (boundary: one below 3.0x)")
        void streak19Is2x() {
            assertThat(gameService.calculatePoints(true, 1000, 19)).isEqualTo(300);
        }

        @Test
        @DisplayName("streak=20 → 3.0x → 450 pts")
        void streak20Is3x() {
            // (int)((100+50)*3.0) = 450
            assertThat(gameService.calculatePoints(true, 1000, 20)).isEqualTo(450);
        }

        @Test
        @DisplayName("streak=50 → 3.0x still → 450 pts (no cap above 3x)")
        void streak50IsStill3x() {
            assertThat(gameService.calculatePoints(true, 1000, 50)).isEqualTo(450);
        }

        @Test
        @DisplayName("Slow answer (60000 ms) + streak=5 → 150 pts (100 base * 1.5x)")
        void slowAnswerWithStreak5() {
            // (100+0)*1.5 = 150
            assertThat(gameService.calculatePoints(true, 60000, 5)).isEqualTo(150);
        }

        @Test
        @DisplayName("Slow answer (60000 ms) + streak=10 → 200 pts (100 base * 2.0x)")
        void slowAnswerWithStreak10() {
            assertThat(gameService.calculatePoints(true, 60000, 10)).isEqualTo(200);
        }

        @Test
        @DisplayName("Slow answer (60000 ms) + streak=20 → 300 pts (100 base * 3.0x)")
        void slowAnswerWithStreak20() {
            assertThat(gameService.calculatePoints(true, 60000, 20)).isEqualTo(300);
        }

        @Test
        @DisplayName("Fractional result is truncated (floor for positives): (149 * 1.5) = 223")
        void fractionIsTruncated() {
            // timeBonus for 4000ms: (4000-3000)/1000=1, bonus=49 → (100+49)*1.5 = 223.5 → (int)=223
            assertThat(gameService.calculatePoints(true, 4000, 5)).isEqualTo(223);
        }
    }

    @Nested
    @DisplayName("calculatePoints — wrong answers always yield 0")
    class WrongAnswerScoring {

        @Test
        @DisplayName("Wrong answer, fast, no streak → 0 pts")
        void wrongFastNoStreak() {
            assertThat(gameService.calculatePoints(false, 1000, 0)).isEqualTo(0);
        }

        @Test
        @DisplayName("Wrong answer with active streak → 0 pts")
        void wrongWithStreak() {
            assertThat(gameService.calculatePoints(false, 1000, 5)).isEqualTo(0);
        }

        @Test
        @DisplayName("Wrong answer at max streak → still 0 pts")
        void wrongWithMaxStreak() {
            assertThat(gameService.calculatePoints(false, 1000, 20)).isEqualTo(0);
        }
    }

    // -----------------------------------------------------------------------
    // Streak state management via submitGuess (mocked repositories)
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("Streak state management (via submitGuess)")
    class StreakStateManagement {

        private GameSession session;
        private UUID sessionId;

        @BeforeEach
        void setUpSession() {
            sessionId = UUID.randomUUID();
            session = GameSession.builder()
                    .id(sessionId.toString())
                    .userId(testUser.getId())
                    .mapType("WORLD")
                    .status("IN_PROGRESS")
                    .finalScore(0)
                    .correctCount(0)
                    .totalCount(0)
                    .bestStreak(0)
                    .currentStreak(0)
                    .build();

            when(gameSessionRepository.findById(sessionId.toString()))
                    .thenReturn(Optional.of(session));
            when(gameSessionRepository.save(any(GameSession.class)))
                    .thenAnswer(inv -> inv.getArgument(0));
        }

        private GuessResultDto submitCorrect(long timeTakenMs) {
            GuessRequest req = new GuessRequest();
            req.setCountryCode("US");
            req.setIsCorrect(true);
            req.setTimeTakenMs(timeTakenMs);
            return gameService.submitGuess("test@example.com", sessionId, req);
        }

        private GuessResultDto submitWrong(long timeTakenMs) {
            GuessRequest req = new GuessRequest();
            req.setCountryCode("BR");
            req.setIsCorrect(false);
            req.setTimeTakenMs(timeTakenMs);
            return gameService.submitGuess("test@example.com", sessionId, req);
        }

        @Test
        @DisplayName("Streak increments on each correct answer")
        void streakIncrementsOnCorrect() {
            for (int i = 1; i <= 5; i++) {
                GuessResultDto result = submitCorrect(1000);
                assertThat(result.getCurrentStreak()).isEqualTo(i);
            }
        }

        @Test
        @DisplayName("Streak resets to 0 after a wrong answer")
        void streakResetsOnWrongAnswer() {
            // Build streak to 5
            for (int i = 0; i < 5; i++) {
                submitCorrect(1000);
            }
            assertThat(session.getCurrentStreak()).isEqualTo(5);

            // Wrong answer
            GuessResultDto result = submitWrong(1000);
            assertThat(result.getCurrentStreak()).isEqualTo(0);
            assertThat(session.getCurrentStreak()).isEqualTo(0);
        }

        @Test
        @DisplayName("Wrong answer earns 0 points")
        void wrongAnswerEarnsZeroPoints() {
            // Build streak to 7 (any multiplier)
            for (int i = 0; i < 7; i++) {
                submitCorrect(1000);
            }
            GuessResultDto result = submitWrong(1000);
            assertThat(result.getPointsEarned()).isEqualTo(0);
        }

        @Test
        @DisplayName("Best streak is preserved after a reset")
        void bestStreakPreservedAfterReset() {
            // Build streak to 7
            for (int i = 0; i < 7; i++) {
                submitCorrect(1000);
            }
            assertThat(session.getBestStreak()).isEqualTo(7);

            // Reset
            submitWrong(1000);
            assertThat(session.getCurrentStreak()).isEqualTo(0);
            assertThat(session.getBestStreak()).isEqualTo(7); // best not lost

            // Build new streak to 3 — best must still be 7
            for (int i = 0; i < 3; i++) {
                submitCorrect(1000);
            }
            assertThat(session.getBestStreak()).isEqualTo(7);
        }

        @Test
        @DisplayName("Best streak updates when new streak exceeds the old best")
        void bestStreakUpdatesWhenHigher() {
            // First streak: 5
            for (int i = 0; i < 5; i++) {
                submitCorrect(1000);
            }
            submitWrong(1000); // reset

            // Second streak: 10
            for (int i = 0; i < 10; i++) {
                submitCorrect(1000);
            }
            assertThat(session.getBestStreak()).isEqualTo(10);
        }

        @Test
        @DisplayName("New session starts with streak = 0 and bestStreak = 0")
        void initialStreakValues() {
            assertThat(session.getCurrentStreak()).isEqualTo(0);
            assertThat(session.getBestStreak()).isEqualTo(0);
        }

        @Test
        @DisplayName("Multiplier applied correctly: 5th correct gets 1.0x (streak was 4), 6th gets 1.5x (streak was 5)")
        void streakMultiplierAppliedBasedOnCurrentStreakBeforeGuess() {
            // Build streak to 4
            for (int i = 0; i < 4; i++) {
                submitCorrect(1000);
            }
            // On 5th guess, session.getCurrentStreak() = 4 → calculatePoints(true, 1000, 4) → 1.0x → 150
            GuessResultDto fifth = submitCorrect(1000);
            assertThat(fifth.getPointsEarned()).isEqualTo(150); // still 1.0x (streak was 4)
            assertThat(session.getCurrentStreak()).isEqualTo(5);

            // On 6th guess, session.getCurrentStreak() = 5 → calculatePoints(true, 1000, 5) → 1.5x → 225
            GuessResultDto sixth = submitCorrect(1000);
            assertThat(sixth.getPointsEarned()).isEqualTo(225); // 1.5x kicks in
        }

        @Test
        @DisplayName("Total score accumulates correctly across multiple guesses")
        void totalScoreAccumulates() {
            // 3 correct fast answers, streak 0,1,2 before each → all get 150 pts (1x)
            submitCorrect(1000);
            submitCorrect(1000);
            submitCorrect(1000);
            // Wrong answer → 0 pts
            submitWrong(1000);

            assertThat(session.getFinalScore()).isEqualTo(450);
        }
    }
}
