package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.AuthResponse;
import com.flexfit.userservice.dto.LoginRequest;
import com.flexfit.userservice.dto.UserResponse;
import com.flexfit.userservice.models.User;
import com.flexfit.userservice.models.UserPreferences;
import com.flexfit.userservice.models.enums.Gender;
import com.flexfit.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserService userService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private LoginRequest loginRequest;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        // Set up test JWT secret for token generation
        ReflectionTestUtils.setField(authService, "jwtSecret", "test-secret-key-that-is-at-least-32-characters-long-for-hmac-sha256");
        ReflectionTestUtils.setField(authService, "jwtExpirationInSeconds", 3600);

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("encodedPassword");
        testUser.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testUser.setGender(Gender.MALE);
        testUser.setHeightCm(180);
        testUser.setWeightKg(75.0);
        testUser.setCreatedAt(LocalDateTime.now());

        // Create preferences for the user
        UserPreferences preferences = new UserPreferences();
        preferences.setId(testUser.getId());
        preferences.setUser(testUser);
        testUser.setPreferences(preferences);

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");

        userResponse = new UserResponse();
        userResponse.setId(testUser.getId());
        userResponse.setUsername(testUser.getUsername());
        userResponse.setEmail(testUser.getEmail());
        userResponse.setDateOfBirth(testUser.getDateOfBirth());
        userResponse.setHeightCm(testUser.getHeightCm());
        userResponse.setWeightKg(testUser.getWeightKg());
        userResponse.setGender(testUser.getGender());
        userResponse.setCreatedAt(testUser.getCreatedAt());
    }

    @Test
    void login_Success() {
        // Given
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(true);
        when(userService.getUserById(testUser.getId())).thenReturn(Optional.of(userResponse));

        // When
        AuthResponse result = authService.login(loginRequest);

        // Then
        assertNotNull(result);
        assertNotNull(result.getToken());
        assertEquals("Bearer", result.getTokenType());
        assertEquals("Login successful", result.getMessage());
        assertNotNull(result.getUser());
        assertEquals("test@example.com", result.getUser().getEmail());
        assertEquals("testuser", result.getUser().getUsername());

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).matches("password123", "encodedPassword");
        verify(userService).getUserById(testUser.getId());
    }

    @Test
    void login_UserNotFound() {
        // Given
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.empty());

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.login(loginRequest)
        );
        assertEquals("Invalid email or password", exception.getMessage());

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userService, never()).getUserById(any());
    }

    @Test
    void login_InvalidPassword() {
        // Given
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(false);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.login(loginRequest)
        );
        assertEquals("Invalid email or password", exception.getMessage());

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).matches("password123", "encodedPassword");
        verify(userService, never()).getUserById(any());
    }

    @Test
    void registerAndLogin_Success() {
        // Given
        String email = "test@example.com";
        String password = "password123";
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(password, testUser.getPasswordHash())).thenReturn(true);
        when(userService.getUserById(testUser.getId())).thenReturn(Optional.of(userResponse));

        // When
        AuthResponse result = authService.registerAndLogin(email, password);

        // Then
        assertNotNull(result);
        assertNotNull(result.getToken());
        assertEquals("Bearer", result.getTokenType());
        assertEquals("Login successful", result.getMessage());
        assertNotNull(result.getUser());
        assertEquals(email, result.getUser().getEmail());

        verify(userRepository).findByEmail(email);
        verify(passwordEncoder).matches(password, "encodedPassword");
        verify(userService).getUserById(testUser.getId());
    }

    @Test
    void registerAndLogin_UserNotFound() {
        // Given
        String email = "nonexistent@example.com";
        String password = "password123";
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.registerAndLogin(email, password)
        );
        assertEquals("Invalid email or password", exception.getMessage());

        verify(userRepository).findByEmail(email);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userService, never()).getUserById(any());
    }

    @Test
    void login_NullLoginRequest() {
        // When & Then
        assertThrows(
            NullPointerException.class,
            () -> authService.login(null)
        );

        verify(userRepository, never()).findByEmail(anyString());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(userService, never()).getUserById(any());
    }

    @Test
    void login_EmptyEmail() {
        // Given
        LoginRequest emptyEmailRequest = new LoginRequest();
        emptyEmailRequest.setEmail("");
        emptyEmailRequest.setPassword("password123");

        when(userRepository.findByEmail("")).thenReturn(Optional.empty());

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.login(emptyEmailRequest)
        );
        assertEquals("Invalid email or password", exception.getMessage());

        verify(userRepository).findByEmail("");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_EmptyPassword() {
        // Given
        LoginRequest emptyPasswordRequest = new LoginRequest();
        emptyPasswordRequest.setEmail("test@example.com");
        emptyPasswordRequest.setPassword("");

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("", testUser.getPasswordHash())).thenReturn(false);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.login(emptyPasswordRequest)
        );
        assertEquals("Invalid email or password", exception.getMessage());

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).matches("", "encodedPassword");
    }
} 