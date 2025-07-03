package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.UserRegistrationRequest;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private UserRegistrationRequest registrationRequest;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("encodedPassword");
        testUser.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testUser.setGender(Gender.MALE);
        testUser.setHeightCm(180);
        testUser.setWeightKg(75.0);
        testUser.setCreatedAt(LocalDateTime.now());

        // Create empty preferences for the user
        UserPreferences preferences = new UserPreferences();
        testUser.setPreferences(preferences);

        registrationRequest = new UserRegistrationRequest();
        registrationRequest.setUsername("testuser");
        registrationRequest.setEmail("test@example.com");
        registrationRequest.setPassword("password123");
        registrationRequest.setDateOfBirth(LocalDate.of(1990, 1, 1));
        registrationRequest.setGender(Gender.MALE);
        registrationRequest.setHeightCm(180);
        registrationRequest.setWeightKg(75.0);
    }

    @Test
    void registerUser_Success() {
        // Given
        when(userRepository.findByUsername(registrationRequest.getUsername())).thenReturn(Optional.empty());
        when(userRepository.findByEmail(registrationRequest.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(registrationRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        UserResponse result = userService.registerUser(registrationRequest);

        // Then
        assertNotNull(result);
        assertEquals(testUserId, result.getId());
        assertEquals("testuser", result.getUsername());
        assertEquals("test@example.com", result.getEmail());
        assertEquals(LocalDate.of(1990, 1, 1), result.getDateOfBirth());
        assertEquals(Gender.MALE, result.getGender());
        assertEquals(180, result.getHeightCm());
        assertEquals(75.0, result.getWeightKg());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getPreferences());

        verify(userRepository).findByUsername("testuser");
        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_UsernameAlreadyExists() {
        // Given
        when(userRepository.findByUsername(registrationRequest.getUsername())).thenReturn(Optional.of(testUser));

        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> userService.registerUser(registrationRequest)
        );
        assertEquals("Username already exists", exception.getMessage());

        verify(userRepository).findByUsername("testuser");
        verify(userRepository, never()).findByEmail(anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void registerUser_EmailAlreadyExists() {
        // Given
        when(userRepository.findByUsername(registrationRequest.getUsername())).thenReturn(Optional.empty());
        when(userRepository.findByEmail(registrationRequest.getEmail())).thenReturn(Optional.of(testUser));

        // When & Then
        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> userService.registerUser(registrationRequest)
        );
        assertEquals("Email already registered", exception.getMessage());

        verify(userRepository).findByUsername("testuser");
        verify(userRepository).findByEmail("test@example.com");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserById_UserExists() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // When
        Optional<UserResponse> result = userService.getUserById(testUserId);

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertEquals(testUserId, userResponse.getId());
        assertEquals("testuser", userResponse.getUsername());
        assertEquals("test@example.com", userResponse.getEmail());
        assertEquals(LocalDate.of(1990, 1, 1), userResponse.getDateOfBirth());
        assertEquals(Gender.MALE, userResponse.getGender());
        assertEquals(180, userResponse.getHeightCm());
        assertEquals(75.0, userResponse.getWeightKg());

        verify(userRepository).findById(testUserId);
    }

    @Test
    void getUserById_UserNotExists() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.getUserById(testUserId);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findById(testUserId);
    }

    @Test
    void getUserByEmail_UserExists() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<UserResponse> result = userService.getUserByEmail("test@example.com");

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertEquals("test@example.com", userResponse.getEmail());
        assertEquals("testuser", userResponse.getUsername());
        assertEquals(testUserId, userResponse.getId());

        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void getUserByEmail_UserNotExists() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.getUserByEmail("nonexistent@example.com");

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    void registerUser_WithoutOptionalFields() {
        // Given
        UserRegistrationRequest minimalRequest = new UserRegistrationRequest();
        minimalRequest.setUsername("minimaluser");
        minimalRequest.setEmail("minimal@example.com");
        minimalRequest.setPassword("password123");
        minimalRequest.setDateOfBirth(LocalDate.of(1995, 5, 15));
        minimalRequest.setGender(Gender.FEMALE);
        // heightCm and weightKg are null

        User minimalUser = new User();
        minimalUser.setId(UUID.randomUUID());
        minimalUser.setUsername("minimaluser");
        minimalUser.setEmail("minimal@example.com");
        minimalUser.setPasswordHash("encodedPassword");
        minimalUser.setDateOfBirth(LocalDate.of(1995, 5, 15));
        minimalUser.setGender(Gender.FEMALE);
        minimalUser.setHeightCm(null);
        minimalUser.setWeightKg(null);
        minimalUser.setCreatedAt(LocalDateTime.now());
        minimalUser.setPreferences(new UserPreferences());

        when(userRepository.findByUsername(minimalRequest.getUsername())).thenReturn(Optional.empty());
        when(userRepository.findByEmail(minimalRequest.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(minimalRequest.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(minimalUser);

        // When
        UserResponse result = userService.registerUser(minimalRequest);

        // Then
        assertNotNull(result);
        assertEquals("minimaluser", result.getUsername());
        assertEquals("minimal@example.com", result.getEmail());
        assertEquals(Gender.FEMALE, result.getGender());
        assertNull(result.getHeightCm());
        assertNull(result.getWeightKg());

        verify(userRepository).findByUsername("minimaluser");
        verify(userRepository).findByEmail("minimal@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_NullRequest() {
        // When & Then
        assertThrows(
            NullPointerException.class,
            () -> userService.registerUser(null)
        );

        verify(userRepository, never()).findByUsername(anyString());
        verify(userRepository, never()).findByEmail(anyString());
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void getUserById_NullId() {
        // Given
        when(userRepository.findById(null)).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.getUserById(null);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findById(null);
    }

    @Test
    void getUserByEmail_NullEmail() {
        // When
        Optional<UserResponse> result = userService.getUserByEmail(null);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findByEmail(null);
    }

    @Test
    void getUserByEmail_EmptyEmail() {
        // Given
        when(userRepository.findByEmail("")).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.getUserByEmail("");

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findByEmail("");
    }

    @Test
    void convertToUserResponse_WithPreferences() {
        // This is tested implicitly through the other tests since it's a private method
        // The conversion logic is verified through registerUser and getUserById tests
        
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // When
        Optional<UserResponse> result = userService.getUserById(testUserId);

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertNotNull(userResponse.getPreferences());
        // The preferences object should be empty but not null
    }
} 