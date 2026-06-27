package com.geomaster;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full end-to-end integration test for the game flow:
 *
 *   Register → Login → Start Session → Submit Guesses → Complete → Leaderboard
 *
 * Runs against a real Spring Boot context (random port) with an in-memory H2
 * database ("test" profile). Validates HTTP status codes, response shapes, and
 * the scoring algorithm at the API boundary.
 *
 * JSON field names used in assertions match the actual DTOs:
 *   GuessResultDto  : correct, pointsEarned, streakBonus, totalScore, currentStreak, bestStreak
 *   GameCompleteDto : finalScore, correctCount, totalCount, accuracy, timeTakenMs, bestStreak,
 *                     previousBest, newPersonalBest
 *   GameSessionDto  : sessionId, mapType, regionCode, countries, totalCountries
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class GameControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String authBaseUrl;
    private String gameBaseUrl;
    private String leaderboardBaseUrl;

    // Shared state set up per test class (all tests reuse the same user)
    private String token;
    private String userId;

    @BeforeEach
    void setUp() {
        authBaseUrl        = "http://localhost:" + port + "/api/auth";
        gameBaseUrl        = "http://localhost:" + port + "/api/game";
        leaderboardBaseUrl = "http://localhost:" + port + "/api/leaderboard";

        // Register a fresh test user with unique credentials
        Map<String, String> reg = Map.of(
                "username", "game_it_user_" + System.nanoTime(),
                "email",    "game_it_" + System.nanoTime() + "@test.com",
                "password", "Secure123!"
        );
        ResponseEntity<Map> regResp = postJson(authBaseUrl + "/register", reg, null);
        assertThat(regResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        token  = (String) regResp.getBody().get("token");
        userId = (String) ((Map<?, ?>) regResp.getBody().get("user")).get("id");
    }

    // -----------------------------------------------------------------------
    // Full happy-path flow
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("Full flow: register → start → 3 guesses → complete → leaderboard")
    void fullGameFlow() {
        // ── Step 1: Start a session ─────────────────────────────────────────
        Map<String, String> startBody = Map.of("mapType", "WORLD");
        ResponseEntity<Map> startResp = postJson(gameBaseUrl + "/session/start", startBody, token);

        assertThat(startResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String sessionId = (String) startResp.getBody().get("sessionId");
        assertThat(sessionId).isNotBlank();

        @SuppressWarnings("unchecked")
        List<Map<String, String>> countries =
                (List<Map<String, String>>) startResp.getBody().get("countries");
        assertThat(countries).isNotEmpty();

        // Verify the countries list has ISO alpha-2 codes
        assertThat(countries.get(0)).containsKey("code");
        assertThat(countries.get(0).get("code")).hasSize(2); // e.g. "us", "br"

        // ── Step 2: Submit 3 correct guesses ────────────────────────────────
        int expectedTotalScore = 0;

        for (int i = 0; i < 3; i++) {
            Map<String, Object> guessBody = Map.of(
                    "countryCode", countries.get(i).get("code"),
                    "isCorrect",   true,
                    "timeTakenMs", 1000   // fast → full time bonus
            );

            ResponseEntity<Map> guessResp =
                    postJson(gameBaseUrl + "/session/" + sessionId + "/guess", guessBody, token);

            assertThat(guessResp.getStatusCode()).isEqualTo(HttpStatus.OK);

            @SuppressWarnings("unchecked")
            Map<String, Object> guessBody2 = (Map<String, Object>) guessResp.getBody();
            // GuessResultDto fields: correct, pointsEarned, streakBonus, totalScore, currentStreak, bestStreak
            assertThat(guessBody2).containsKeys("pointsEarned", "totalScore", "currentStreak", "correct");
            assertThat(guessBody2.get("correct")).isEqualTo(true);

            int pointsEarned = ((Number) guessBody2.get("pointsEarned")).intValue();
            int streak = i + 1;

            // Validate scoring formula: base=100, timeBonus=50 (1000ms < 3000ms),
            // streak before guess is i (0, 1, 2) — all < 5 → 1x multiplier
            // Expected: floor((100 + 50) * 1.0) = 150 for each of first 3 correct
            assertThat(pointsEarned).isEqualTo(150);
            expectedTotalScore += pointsEarned;

            assertThat(((Number) guessBody2.get("currentStreak")).intValue()).isEqualTo(streak);
        }

        // ── Step 3: Submit 1 wrong guess ────────────────────────────────────
        Map<String, Object> wrongGuess = Map.of(
                "countryCode", countries.get(3).get("code"),
                "isCorrect",   false,
                "timeTakenMs", 5000
        );
        ResponseEntity<Map> wrongResp =
                postJson(gameBaseUrl + "/session/" + sessionId + "/guess", wrongGuess, token);

        assertThat(wrongResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Number) wrongResp.getBody().get("pointsEarned")).intValue()).isEqualTo(0);
        assertThat(((Number) wrongResp.getBody().get("currentStreak")).intValue()).isEqualTo(0);

        // ── Step 4: Complete the session ────────────────────────────────────
        ResponseEntity<Map> completeResp =
                postJson(gameBaseUrl + "/session/" + sessionId + "/complete", Map.of(), token);

        assertThat(completeResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> completeBody = (Map<String, Object>) completeResp.getBody();
        // GameCompleteDto fields: finalScore, correctCount, totalCount, accuracy,
        //                         timeTakenMs, bestStreak, previousBest, newPersonalBest
        assertThat(completeBody).containsKeys(
                "finalScore", "correctCount", "totalCount", "accuracy",
                "bestStreak", "timeTakenMs"
        );

        int finalScore = ((Number) completeBody.get("finalScore")).intValue();
        assertThat(finalScore).isEqualTo(expectedTotalScore);

        int correctCount = ((Number) completeBody.get("correctCount")).intValue();
        assertThat(correctCount).isEqualTo(3);

        int bestStreak = ((Number) completeBody.get("bestStreak")).intValue();
        assertThat(bestStreak).isEqualTo(3);

        // ── Step 5: Check global leaderboard ────────────────────────────────
        ResponseEntity<List> lbResp = restTemplate.exchange(
                leaderboardBaseUrl + "?mapType=WORLD&period=ALL_TIME",
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                List.class
        );

        assertThat(lbResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> entries = lbResp.getBody();
        assertThat(entries).isNotNull();

        // Our session should appear in the leaderboard (LeaderboardEntryDto: userId, score, rank, ...)
        boolean foundOurSession = entries.stream()
                .anyMatch(entry -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> e = (Map<String, Object>) entry;
                    return userId.equals(e.get("userId"))
                            && finalScore == ((Number) e.get("score")).intValue();
                });
        assertThat(foundOurSession).isTrue();
    }

    // -----------------------------------------------------------------------
    // Auth guard checks
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("Start session without token → 401 Unauthorized")
    void startSessionWithoutToken() {
        Map<String, String> body = Map.of("mapType", "WORLD");
        ResponseEntity<Map> response = postJson(gameBaseUrl + "/session/start", body, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Submit guess to non-existent session → 404 Not Found")
    void guessOnMissingSession() {
        Map<String, Object> body = Map.of("countryCode", "US", "isCorrect", true, "timeTakenMs", 1000);
        ResponseEntity<Map> response =
                postJson(gameBaseUrl + "/session/00000000-0000-0000-0000-000000000000/guess", body, token);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("Complete a session twice → 409 Conflict with SESSION_ALREADY_COMPLETED")
    void completeSessionTwice() {
        // Start + complete
        ResponseEntity<Map> startResp =
                postJson(gameBaseUrl + "/session/start", Map.of("mapType", "WORLD"), token);
        String sessionId = (String) startResp.getBody().get("sessionId");

        postJson(gameBaseUrl + "/session/" + sessionId + "/complete", Map.of(), token);

        // Second complete attempt
        ResponseEntity<Map> secondComplete =
                postJson(gameBaseUrl + "/session/" + sessionId + "/complete", Map.of(), token);

        assertThat(secondComplete.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(secondComplete.getBody().get("error")).isEqualTo("SESSION_ALREADY_COMPLETED");
    }

    @Test
    @DisplayName("Another user cannot submit guess to a session they don't own → 403 Forbidden")
    void guessOnOtherUserSession() {
        // Start session as our user
        ResponseEntity<Map> startResp =
                postJson(gameBaseUrl + "/session/start", Map.of("mapType", "WORLD"), token);
        String sessionId = (String) startResp.getBody().get("sessionId");

        // Register a second user
        Map<String, String> reg2 = Map.of(
                "username", "other_user_" + System.nanoTime(),
                "email",    "other_" + System.nanoTime() + "@test.com",
                "password", "Secure123!"
        );
        ResponseEntity<Map> reg2Resp = postJson(authBaseUrl + "/register", reg2, null);
        String otherToken = (String) reg2Resp.getBody().get("token");

        // Other user tries to guess on our session
        Map<String, Object> body = Map.of("countryCode", "US", "isCorrect", true, "timeTakenMs", 1000);
        ResponseEntity<Map> response =
                postJson(gameBaseUrl + "/session/" + sessionId + "/guess", body, otherToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Invalid mapType → 400 Bad Request with INVALID_MAP_TYPE")
    void invalidMapType() {
        Map<String, String> body = Map.of("mapType", "MARS");
        ResponseEntity<Map> response = postJson(gameBaseUrl + "/session/start", body, token);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("error")).isEqualTo("INVALID_MAP_TYPE");
    }

    // -----------------------------------------------------------------------
    // Scoring formula verification at HTTP boundary
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("Streak multiplier is applied correctly: 6th correct answer (streak=5 before) gets 1.5x → 225 pts")
    void streakMultiplierAt5() {
        ResponseEntity<Map> startResp =
                postJson(gameBaseUrl + "/session/start", Map.of("mapType", "WORLD"), token);
        String sessionId = (String) startResp.getBody().get("sessionId");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> countries =
                (List<Map<String, String>>) startResp.getBody().get("countries");

        // Submit 5 correct guesses to build streak to 5
        // Before guess i: streak = i → all < 5 → 1.0x → 150 pts each
        for (int i = 0; i < 5; i++) {
            postJson(gameBaseUrl + "/session/" + sessionId + "/guess",
                    Map.of("countryCode", countries.get(i).get("code"), "isCorrect", true, "timeTakenMs", 1000),
                    token);
        }

        // 6th correct answer: streak BEFORE = 5 → calculatePoints(true, 1000, 5) → 1.5x → 225 pts
        // base=100, timeBonus=50 (1000 ms < 3000 ms), points = floor(150 * 1.5) = 225
        ResponseEntity<Map> sixth = postJson(
                gameBaseUrl + "/session/" + sessionId + "/guess",
                Map.of("countryCode", countries.get(5).get("code"), "isCorrect", true, "timeTakenMs", 1000),
                token
        );

        assertThat(sixth.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Number) sixth.getBody().get("pointsEarned")).intValue()).isEqualTo(225);
        assertThat(((Number) sixth.getBody().get("currentStreak")).intValue()).isEqualTo(6);
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private ResponseEntity<Map> postJson(String url, Object body, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }
        return restTemplate.exchange(url, HttpMethod.POST, new HttpEntity<>(body, headers), Map.class);
    }
}
