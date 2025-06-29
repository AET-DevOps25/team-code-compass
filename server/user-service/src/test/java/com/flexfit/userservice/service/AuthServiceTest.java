package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.AuthResponse;
import com.flexfit.userservice.dto.LoginRequest;
import com.flexfit.userservice.dto.UserRegistrationRequest;
import com.flexfit.userservice.dto.UserResponse;
import com.flexfit.userservice.models.User;
import com.flexfit.userservice.models.enums.Gender;
import com.flexfit.userservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.LocalDate;
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
    private UserRegistrationRequest registrationRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testUser.setAge(33);
        testUser.setGender(Gender.MALE);
        testUser.setHeight(180);
        testUser.setWeight(75);

        registrationRequest = new UserRegistrationRequest(
            "testuser",
            "test@example.com",
            "password123",
            "Test",
            "User",
            LocalDate.of(1990, 1, 1),
            33,
            Gender.MALE,
            180,
            75
        );

        loginRequest = new LoginRequest("test@example.com", "password123");
    }

    @Test
    void registerUser_Success() {
        // Given
        when(userRepository.existsByEmail(registrationRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(registrationRequest.username())).thenReturn(false);
        when(passwordEncoder.encode(registrationRequest.password())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserResponse result = authService.registerUser(registrationRequest);

        // Then
        assertNotNull(result);
        assertEquals("testuser", result.username());
        assertEquals("test@example.com", result.email());
        assertEquals("Test", result.firstName());
        assertEquals("User", result.lastName());
        assertEquals(Gender.MALE, result.gender());
        assertEquals(180, result.heightCm());
        assertEquals(75, result.weightKg());

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository).existsByUsername("testuser");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_EmailAlreadyExists() {
        // Given
        when(userRepository.existsByEmail(registrationRequest.email())).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.registerUser(registrationRequest)
        );
        assertEquals("Email already exists", exception.getMessage());

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository, never()).existsByUsername(anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_UsernameAlreadyExists() {
        // Given
        when(userRepository.existsByEmail(registrationRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(registrationRequest.username())).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.registerUser(registrationRequest)
        );
        assertEquals("Username already exists", exception.getMessage());

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository).existsByUsername("testuser");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void authenticate_Success() {
        // Given
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.password(), testUser.getPassword())).thenReturn(true);

        // When
        AuthResponse result = authService.authenticate(loginRequest);

        // Then
        assertNotNull(result);
        assertNotNull(result.token());
        assertNotNull(result.user());
        assertEquals("test@example.com", result.user().email());
        assertEquals("Authentication successful", result.message());

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).matches("password123", "encodedPassword");
    }

    @Test
    void authenticate_UserNotFound() {
        // Given
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.empty());

        // When & Then
        BadCredentialsException exception = assertThrows(
            BadCredentialsException.class,
            () -> authService.authenticate(loginRequest)
        );
        assertEquals("Invalid email or password", exception.getMessage());

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void authenticate_InvalidPassword() {
        // Given
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.password(), testUser.getPassword())).thenReturn(false);

        // When & Then
        BadCredentialsException exception = assertThrows(
            BadCredentialsException.class,
            () -> authService.authenticate(loginRequest)
        );
        assertEquals("Invalid email or password", exception.getMessage());

        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).matches("password123", "encodedPassword");
    }

    @Test
    void registerAndLogin_Success() {
        // Given
        when(userRepository.existsByEmail(registrationRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(registrationRequest.username())).thenReturn(false);
        when(passwordEncoder.encode(registrationRequest.password())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(passwordEncoder.matches(registrationRequest.password(), testUser.getPassword())).thenReturn(true);

        // When
        AuthResponse result = authService.registerAndLogin(registrationRequest);

        // Then
        assertNotNull(result);
        assertNotNull(result.token());
        assertNotNull(result.user());
        assertEquals("test@example.com", result.user().email());
        assertEquals("Registration and login successful", result.message());

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository).existsByUsername("testuser");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).matches("password123", "encodedPassword");
    }

    @Test
    void registerAndLogin_RegistrationFails() {
        // Given
        when(userRepository.existsByEmail(registrationRequest.email())).thenReturn(true);

        // When & Then
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> authService.registerAndLogin(registrationRequest)
        );
        assertEquals("Email already exists", exception.getMessage());

        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void validateUserData_ValidData() {
        // Given
        UserRegistrationRequest validRequest = new UserRegistrationRequest(
            "validuser",
            "valid@example.com",
            "validPassword123",
            "Valid",
            "User",
            LocalDate.of(1990, 1, 1),
            33,
            Gender.MALE,
            180,
            75
        );

        // When & Then
        assertDoesNotThrow(() -> {
            // This would be a private method validation if exposed
            // For now, we test through the public methods
            when(userRepository.existsByEmail(validRequest.email())).thenReturn(false);
            when(userRepository.existsByUsername(validRequest.username())).thenReturn(false);
            when(passwordEncoder.encode(validRequest.password())).thenReturn("encodedPassword");
            when(userRepository.save(any(User.class))).thenReturn(testUser);
            
            authService.registerUser(validRequest);
        });
    }

    @Test
    void validateUserData_InvalidEmail() {
        // Given
        UserRegistrationRequest invalidRequest = new UserRegistrationRequest(
            "testuser",
            "invalid-email",
            "password123",
            "Test",
            "User",
            LocalDate.of(1990, 1, 1),
            33,
            Gender.MALE,
            180,
            75
        );

        // When & Then
        // This would typically be handled by validation annotations
        // but we can test the service behavior
        when(userRepository.existsByEmail(invalidRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(invalidRequest.username())).thenReturn(false);
        when(passwordEncoder.encode(invalidRequest.password())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // The service should still work, validation would be at controller level
        assertDoesNotThrow(() -> authService.registerUser(invalidRequest));
    }

    @Test
    void authenticate_NullLoginRequest() {
        // When & Then
        assertThrows(
            NullPointerException.class,
            () -> authService.authenticate(null)
        );
    }

    @Test
    void registerUser_NullRegistrationRequest() {
        // When & Then
        assertThrows(
            NullPointerException.class,
            () -> authService.registerUser(null)
        );
    }
} 