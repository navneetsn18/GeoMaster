package com.geomaster;

import com.geomaster.dto.request.LoginRequest;
import com.geomaster.dto.request.RegisterRequest;
import com.geomaster.dto.response.AuthResponse;
import com.geomaster.exception.DuplicateEmailException;
import com.geomaster.exception.DuplicateUsernameException;
import com.geomaster.model.User;
import com.geomaster.repository.UserRepository;
import com.geomaster.security.JwtTokenProvider;
import com.geomaster.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for AuthService.
 *
 * Implementation notes (derived from reading AuthService.java):
 *  - register() checks existsByEmail / existsByUsername and throws IllegalArgumentException
 *    for duplicates (these map to 400 Bad Request via GlobalExceptionHandler)
 *  - login() delegates to authenticationManager.authenticate(); Spring Security
 *    throws BadCredentialsException for wrong credentials (→ 401) and may throw
 *    UsernameNotFoundException for unknown email (converted to BadCredentials by default)
 *  - JwtTokenProvider (not JwtService) generates the token
 *  - User.id is UUID, not String
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private static final String VALID_USERNAME = "geoking";
    private static final String VALID_EMAIL    = "geoking@example.com";
    private static final String VALID_PASSWORD = "Secure123!";
    private static final String HASHED_PW      = "$2a$10$hashedpassword";
    private static final String FAKE_TOKEN     = "eyJhbGciOiJIUzI1NiJ9.fake.sig";

    private User storedUser;

    @BeforeEach
    void setUp() {
        storedUser = User.builder()
                .id(UUID.randomUUID().toString())
                .username(VALID_USERNAME)
                .email(VALID_EMAIL)
                .passwordHash(HASHED_PW)
                .build();
    }

    // -----------------------------------------------------------------------
    // register()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("register()")
    class Register {

        @Test
        @DisplayName("Valid data → saves user, returns token and user details")
        void validRegistration() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername(VALID_USERNAME);
            req.setEmail(VALID_EMAIL);
            req.setPassword(VALID_PASSWORD);

            when(userRepository.existsByEmail(VALID_EMAIL)).thenReturn(false);
            when(userRepository.existsByUsername(VALID_USERNAME)).thenReturn(false);
            when(passwordEncoder.encode(VALID_PASSWORD)).thenReturn(HASHED_PW);
            when(userRepository.save(any(User.class))).thenReturn(storedUser);
            when(jwtTokenProvider.generateToken(storedUser)).thenReturn(FAKE_TOKEN);

            AuthResponse response = authService.register(req);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo(FAKE_TOKEN);
            assertThat(response.getUser()).isNotNull();
            assertThat(response.getUser().getUsername()).isEqualTo(VALID_USERNAME);
            assertThat(response.getUser().getEmail()).isEqualTo(VALID_EMAIL);
            assertThat(response.getUser().getId()).isNotNull();

            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("Duplicate email → throws IllegalArgumentException, no user saved")
        void duplicateEmail() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername(VALID_USERNAME);
            req.setEmail(VALID_EMAIL);
            req.setPassword(VALID_PASSWORD);

            when(userRepository.existsByEmail(VALID_EMAIL)).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(DuplicateEmailException.class)
                    .hasMessageContaining("Email");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Duplicate username → throws IllegalArgumentException, no user saved")
        void duplicateUsername() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername(VALID_USERNAME);
            req.setEmail(VALID_EMAIL);
            req.setPassword(VALID_PASSWORD);

            when(userRepository.existsByEmail(VALID_EMAIL)).thenReturn(false);
            when(userRepository.existsByUsername(VALID_USERNAME)).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(DuplicateUsernameException.class)
                    .hasMessageContaining("Username");

            verify(userRepository, never()).save(any(User.class));
        }

        @Test
        @DisplayName("Password is stored hashed, never as plaintext")
        void passwordIsHashed() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername(VALID_USERNAME);
            req.setEmail(VALID_EMAIL);
            req.setPassword(VALID_PASSWORD);

            when(userRepository.existsByEmail(VALID_EMAIL)).thenReturn(false);
            when(userRepository.existsByUsername(VALID_USERNAME)).thenReturn(false);
            when(passwordEncoder.encode(VALID_PASSWORD)).thenReturn(HASHED_PW);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                assertThat(u.getPasswordHash()).isNotEqualTo(VALID_PASSWORD);
                assertThat(u.getPasswordHash()).isEqualTo(HASHED_PW);
                return storedUser;
            });
            when(jwtTokenProvider.generateToken(any(User.class))).thenReturn(FAKE_TOKEN);

            authService.register(req);
        }

        @Test
        @DisplayName("Email check is performed before username check")
        void emailCheckedBeforeUsername() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername(VALID_USERNAME);
            req.setEmail(VALID_EMAIL);
            req.setPassword(VALID_PASSWORD);

            when(userRepository.existsByEmail(VALID_EMAIL)).thenReturn(true);

            assertThatThrownBy(() -> authService.register(req))
                    .isInstanceOf(IllegalArgumentException.class);

            // Username check should NOT be called if email already duplicate
            verify(userRepository, never()).existsByUsername(anyString());
        }
    }

    // -----------------------------------------------------------------------
    // login()
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("Correct credentials → authentication succeeds, returns token")
        void validLogin() {
            LoginRequest req = new LoginRequest();
            req.setEmail(VALID_EMAIL);
            req.setPassword(VALID_PASSWORD);

            // Spring Security's AuthenticationManager.authenticate succeeds
            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenReturn(new UsernamePasswordAuthenticationToken(VALID_EMAIL, VALID_PASSWORD));
            when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(storedUser));
            when(jwtTokenProvider.generateToken(storedUser)).thenReturn(FAKE_TOKEN);

            AuthResponse response = authService.login(req);

            assertThat(response).isNotNull();
            assertThat(response.getToken()).isEqualTo(FAKE_TOKEN);
            assertThat(response.getUser().getEmail()).isEqualTo(VALID_EMAIL);
        }

        @Test
        @DisplayName("Wrong password → AuthenticationManager throws BadCredentialsException")
        void wrongPassword() {
            LoginRequest req = new LoginRequest();
            req.setEmail(VALID_EMAIL);
            req.setPassword("WrongPass99!");

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(BadCredentialsException.class);

            verify(jwtTokenProvider, never()).generateToken(any());
        }

        @Test
        @DisplayName("Non-existent email → AuthenticationManager throws BadCredentialsException (default Spring behaviour)")
        void nonExistentEmail() {
            // DaoAuthenticationProvider converts UsernameNotFoundException to BadCredentials by default
            LoginRequest req = new LoginRequest();
            req.setEmail("ghost@nowhere.com");
            req.setPassword(VALID_PASSWORD);

            when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                    .thenThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(req))
                    .isInstanceOf(BadCredentialsException.class);

            verify(userRepository, never()).findByEmail(anyString());
            verify(jwtTokenProvider, never()).generateToken(any());
        }

        @Test
        @DisplayName("Successful login does not expose password in response")
        void loginResponseDoesNotExposePassword() {
            LoginRequest req = new LoginRequest();
            req.setEmail(VALID_EMAIL);
            req.setPassword(VALID_PASSWORD);

            when(authenticationManager.authenticate(any())).thenReturn(
                    new UsernamePasswordAuthenticationToken(VALID_EMAIL, null));
            when(userRepository.findByEmail(VALID_EMAIL)).thenReturn(Optional.of(storedUser));
            when(jwtTokenProvider.generateToken(storedUser)).thenReturn(FAKE_TOKEN);

            AuthResponse response = authService.login(req);

            // UserDto should not contain a passwordHash field
            assertThat(response.getUser()).isNotNull();
            // Confirm via field absence — UserDto only has id, username, email
            assertThat(response.getUser().getClass().getDeclaredFields())
                    .extracting(java.lang.reflect.Field::getName)
                    .doesNotContain("passwordHash", "password");
        }
    }
}
