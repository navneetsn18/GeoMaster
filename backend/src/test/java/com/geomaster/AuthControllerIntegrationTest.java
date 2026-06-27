package com.geomaster;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the Auth HTTP layer.
 *
 * Uses a real Spring Boot context on a random port and an in-memory H2
 * database (activated via the "test" profile).
 *
 * Endpoints covered:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port + "/api/auth";
    }

    // -----------------------------------------------------------------------
    // POST /api/auth/register
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/register")
    class RegisterEndpoint {

        @Test
        @DisplayName("Valid payload → 201 Created with token and user")
        void registerSuccess() {
            long ts = System.nanoTime();
            String username = "integration_user_" + ts;
            String email    = "integration_" + ts + "@test.com";
            Map<String, String> body = Map.of(
                    "username", username,
                    "email",    email,
                    "password", "Secure123!"
            );

            ResponseEntity<Map> response = postJson(baseUrl + "/register", body, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            assertThat(response.getBody()).containsKey("token");
            assertThat(response.getBody()).containsKey("user");

            @SuppressWarnings("unchecked")
            Map<String, Object> user = (Map<String, Object>) response.getBody().get("user");
            assertThat(user).containsKey("id");
            assertThat(user.get("username")).isEqualTo(username);
            assertThat(user.get("email")).isEqualTo(email);
        }

        @Test
        @DisplayName("Missing email → 400 Bad Request")
        void registerMissingEmail() {
            Map<String, String> body = Map.of(
                    "username", "no_email_user",
                    "password", "Secure123!"
            );

            ResponseEntity<Map> response = postJson(baseUrl + "/register", body, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }

        @Test
        @DisplayName("Duplicate email → 409 Conflict with EMAIL_TAKEN code")
        void registerDuplicateEmail() {
            String uniqueEmail = "dup_" + System.nanoTime() + "@test.com";
            Map<String, String> body = Map.of(
                    "username", "first_user_" + System.nanoTime(),
                    "email",    uniqueEmail,
                    "password", "Secure123!"
            );
            postJson(baseUrl + "/register", body, null); // first registration

            Map<String, String> dupBody = Map.of(
                    "username", "second_user_" + System.nanoTime(),
                    "email",    uniqueEmail,
                    "password", "Secure123!"
            );
            ResponseEntity<Map> response = postJson(baseUrl + "/register", dupBody, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(response.getBody().get("error")).isEqualTo("EMAIL_TAKEN");
        }

        @Test
        @DisplayName("Duplicate username → 409 Conflict with USERNAME_TAKEN code")
        void registerDuplicateUsername() {
            String uniqueName = "dupname_" + System.nanoTime();
            Map<String, String> body = Map.of(
                    "username", uniqueName,
                    "email",    "first_" + System.nanoTime() + "@test.com",
                    "password", "Secure123!"
            );
            postJson(baseUrl + "/register", body, null); // first registration

            Map<String, String> dupBody = Map.of(
                    "username", uniqueName,
                    "email",    "second_" + System.nanoTime() + "@test.com",
                    "password", "Secure123!"
            );
            ResponseEntity<Map> response = postJson(baseUrl + "/register", dupBody, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(response.getBody().get("error")).isEqualTo("USERNAME_TAKEN");
        }

        @Test
        @DisplayName("Weak password (no uppercase) → 400 Bad Request")
        void registerWeakPassword() {
            Map<String, String> body = Map.of(
                    "username", "weakpw_user_" + System.nanoTime(),
                    "email",    "weakpw_" + System.nanoTime() + "@test.com",
                    "password", "alllowercase1"
            );

            ResponseEntity<Map> response = postJson(baseUrl + "/register", body, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // POST /api/auth/login
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpoint {

        private String loginEmail;
        private String loginPassword;

        @BeforeEach
        void registerUser() {
            loginEmail    = "login_" + System.nanoTime() + "@test.com";
            loginPassword = "Secure123!";
            Map<String, String> reg = Map.of(
                    "username", "login_user_" + System.nanoTime(),
                    "email",    loginEmail,
                    "password", loginPassword
            );
            postJson(baseUrl + "/register", reg, null); // ignore response — just ensure user exists
        }

        @Test
        @DisplayName("Correct credentials → 200 OK with token")
        void loginSuccess() {
            Map<String, String> body = Map.of(
                    "email",    loginEmail,
                    "password", loginPassword
            );

            ResponseEntity<Map> response = postJson(baseUrl + "/login", body, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).containsKey("token");
            String token = (String) response.getBody().get("token");
            assertThat(token).isNotBlank();
        }

        @Test
        @DisplayName("Wrong password → 401 Unauthorized")
        void loginWrongPassword() {
            Map<String, String> body = Map.of(
                    "email",    loginEmail,
                    "password", "WrongPass99!"
            );

            ResponseEntity<Map> response = postJson(baseUrl + "/login", body, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("Non-existent email → 404 Not Found or 401 Unauthorized")
        void loginNonExistentEmail() {
            Map<String, String> body = Map.of(
                    "email",    "ghost@nowhere.com",
                    "password", "Secure123!"
            );

            ResponseEntity<Map> response = postJson(baseUrl + "/login", body, null);

            // Acceptable to return either 404 or 401 — both prevent user enumeration
            assertThat(response.getStatusCode().value())
                    .isIn(HttpStatus.NOT_FOUND.value(), HttpStatus.UNAUTHORIZED.value());
        }

        @Test
        @DisplayName("Missing password field → 400 Bad Request")
        void loginMissingPassword() {
            Map<String, String> body = Map.of("email", loginEmail);

            ResponseEntity<Map> response = postJson(baseUrl + "/login", body, null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        }
    }

    // -----------------------------------------------------------------------
    // GET /api/auth/me
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/auth/me")
    class MeEndpoint {

        private String validToken;
        private String meEmail;
        private String mePassword;
        private String meUsername;

        @BeforeEach
        void registerAndLogin() {
            meEmail    = "me_" + System.nanoTime() + "@test.com";
            mePassword = "Secure123!";
            meUsername = "me_user_" + System.nanoTime();

            Map<String, String> reg = Map.of(
                    "username", meUsername,
                    "email",    meEmail,
                    "password", mePassword
            );
            ResponseEntity<Map> regResp = postJson(baseUrl + "/register", reg, null);

            if (regResp.getStatusCode() == HttpStatus.CREATED) {
                validToken = (String) regResp.getBody().get("token");
            } else {
                // Fall back to login if registration already succeeded
                Map<String, String> loginBody = Map.of(
                        "email",    meEmail,
                        "password", mePassword
                );
                ResponseEntity<Map> loginResp = postJson(baseUrl + "/login", loginBody, null);
                validToken = (String) loginResp.getBody().get("token");
            }
        }

        @Test
        @DisplayName("Valid token → 200 OK with user details")
        void meSuccess() {
            ResponseEntity<Map> response = getJson(baseUrl + "/me", validToken);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).containsKeys("id", "username", "email");
            assertThat(response.getBody().get("username")).isEqualTo(meUsername);
        }

        @Test
        @DisplayName("No token → 401 Unauthorized")
        void meNoToken() {
            ResponseEntity<Map> response = getJson(baseUrl + "/me", null);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }

        @Test
        @DisplayName("Invalid/expired token → 401 Unauthorized")
        void meInvalidToken() {
            ResponseEntity<Map> response = getJson(baseUrl + "/me", "not.a.valid.jwt");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        }
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

    private ResponseEntity<Map> getJson(String url, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);
    }
}
