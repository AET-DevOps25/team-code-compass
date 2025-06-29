package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.UserResponse;
import com.flexfit.userservice.models.User;
import com.flexfit.userservice.models.UserPreferences;
import com.flexfit.userservice.models.enums.*;
import com.flexfit.userservice.repository.UserRepository;
import com.flexfit.userservice.repository.UserPreferencesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
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
    private UserPreferencesRepository userPreferencesRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;
    private UserPreferences testPreferences;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        
        testUser = new User();
        testUser.setId(testUserId);
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

        testPreferences = new UserPreferences();
        testPreferences.setId(UUID.randomUUID());
        testPreferences.setUser(testUser);
        testPreferences.setExperienceLevel(ExperienceLevel.INTERMEDIATE);
        testPreferences.setFitnessGoals(List.of(FitnessGoal.MUSCLE_GAIN, FitnessGoal.WEIGHT_LOSS));
        testPreferences.setPreferredSportTypes(List.of(SportType.STRENGTH));
        testPreferences.setAvailableEquipment(List.of(EquipmentItem.DUMBBELLS));
        testPreferences.setWorkoutDurationRange("30-45 minutes");
        testPreferences.setIntensityPreference(IntensityPreference.MODERATE);
        testPreferences.setHealthNotes("No injuries");
        testPreferences.setDislikedExercises(List.of());
    }

    @Test
    void findById_UserExists() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // When
        Optional<UserResponse> result = userService.findById(testUserId);

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertEquals(testUserId, userResponse.id());
        assertEquals("testuser", userResponse.username());
        assertEquals("test@example.com", userResponse.email());
        assertEquals("Test", userResponse.firstName());
        assertEquals("User", userResponse.lastName());
        assertEquals(Gender.MALE, userResponse.gender());
        assertEquals(180, userResponse.heightCm());
        assertEquals(75, userResponse.weightKg());

        verify(userRepository).findById(testUserId);
    }

    @Test
    void findById_UserNotExists() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.findById(testUserId);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findById(testUserId);
    }

    @Test
    void findByEmail_UserExists() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // When
        Optional<UserResponse> result = userService.findByEmail("test@example.com");

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertEquals("test@example.com", userResponse.email());
        assertEquals("testuser", userResponse.username());

        verify(userRepository).findByEmail("test@example.com");
    }

    @Test
    void findByEmail_UserNotExists() {
        // Given
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.findByEmail("nonexistent@example.com");

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findByEmail("nonexistent@example.com");
    }

    @Test
    void findByUsername_UserExists() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // When
        Optional<UserResponse> result = userService.findByUsername("testuser");

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertEquals("testuser", userResponse.username());
        assertEquals("test@example.com", userResponse.email());

        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void findByUsername_UserNotExists() {
        // Given
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.findByUsername("nonexistent");

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    void findUserWithPreferences_UserAndPreferencesExist() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userPreferencesRepository.findByUserId(testUserId)).thenReturn(Optional.of(testPreferences));

        // When
        Optional<UserResponse> result = userService.findUserWithPreferences(testUserId);

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertNotNull(userResponse.preferences());
        assertEquals(ExperienceLevel.INTERMEDIATE, userResponse.preferences().experienceLevel());
        assertEquals(2, userResponse.preferences().fitnessGoals().size());
        assertTrue(userResponse.preferences().fitnessGoals().contains(FitnessGoal.MUSCLE_GAIN));
        assertTrue(userResponse.preferences().fitnessGoals().contains(FitnessGoal.WEIGHT_LOSS));

        verify(userRepository).findById(testUserId);
        verify(userPreferencesRepository).findByUserId(testUserId);
    }

    @Test
    void findUserWithPreferences_UserExistsButNoPreferences() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userPreferencesRepository.findByUserId(testUserId)).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.findUserWithPreferences(testUserId);

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertNull(userResponse.preferences());

        verify(userRepository).findById(testUserId);
        verify(userPreferencesRepository).findByUserId(testUserId);
    }

    @Test
    void findUserWithPreferences_UserNotExists() {
        // Given
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.findUserWithPreferences(testUserId);

        // Then
        assertFalse(result.isPresent());

        verify(userRepository).findById(testUserId);
        verify(userPreferencesRepository, never()).findByUserId(any());
    }

    @Test
    void existsByEmail_EmailExists() {
        // Given
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        // When
        boolean result = userService.existsByEmail("test@example.com");

        // Then
        assertTrue(result);
        verify(userRepository).existsByEmail("test@example.com");
    }

    @Test
    void existsByEmail_EmailNotExists() {
        // Given
        when(userRepository.existsByEmail("nonexistent@example.com")).thenReturn(false);

        // When
        boolean result = userService.existsByEmail("nonexistent@example.com");

        // Then
        assertFalse(result);
        verify(userRepository).existsByEmail("nonexistent@example.com");
    }

    @Test
    void existsByUsername_UsernameExists() {
        // Given
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        // When
        boolean result = userService.existsByUsername("testuser");

        // Then
        assertTrue(result);
        verify(userRepository).existsByUsername("testuser");
    }

    @Test
    void existsByUsername_UsernameNotExists() {
        // Given
        when(userRepository.existsByUsername("nonexistent")).thenReturn(false);

        // When
        boolean result = userService.existsByUsername("nonexistent");

        // Then
        assertFalse(result);
        verify(userRepository).existsByUsername("nonexistent");
    }

    @Test
    void updateUser_Success() {
        // Given
        User updatedUser = new User();
        updatedUser.setId(testUserId);
        updatedUser.setUsername("updateduser");
        updatedUser.setEmail("updated@example.com");
        updatedUser.setFirstName("Updated");
        updatedUser.setLastName("User");
        updatedUser.setAge(34);
        updatedUser.setHeight(185);
        updatedUser.setWeight(80);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(updatedUser);

        // When
        Optional<UserResponse> result = userService.updateUser(testUserId, updatedUser);

        // Then
        assertTrue(result.isPresent());
        UserResponse userResponse = result.get();
        assertEquals("updateduser", userResponse.username());
        assertEquals("updated@example.com", userResponse.email());
        assertEquals("Updated", userResponse.firstName());
        assertEquals("User", userResponse.lastName());
        assertEquals(34, userResponse.age());
        assertEquals(185, userResponse.heightCm());
        assertEquals(80, userResponse.weightKg());

        verify(userRepository).findById(testUserId);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_UserNotFound() {
        // Given
        User updatedUser = new User();
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // When
        Optional<UserResponse> result = userService.updateUser(testUserId, updatedUser);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository).findById(testUserId);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUser_Success() {
        // Given
        when(userRepository.existsById(testUserId)).thenReturn(true);

        // When
        boolean result = userService.deleteUser(testUserId);

        // Then
        assertTrue(result);
        verify(userRepository).existsById(testUserId);
        verify(userRepository).deleteById(testUserId);
    }

    @Test
    void deleteUser_UserNotFound() {
        // Given
        when(userRepository.existsById(testUserId)).thenReturn(false);

        // When
        boolean result = userService.deleteUser(testUserId);

        // Then
        assertFalse(result);
        verify(userRepository).existsById(testUserId);
        verify(userRepository, never()).deleteById(any());
    }

    @Test
    void getAllUsers() {
        // Given
        User user2 = new User();
        user2.setId(UUID.randomUUID());
        user2.setUsername("user2");
        user2.setEmail("user2@example.com");
        user2.setFirstName("User");
        user2.setLastName("Two");
        user2.setGender(Gender.FEMALE);

        List<User> users = List.of(testUser, user2);
        when(userRepository.findAll()).thenReturn(users);

        // When
        List<UserResponse> result = userService.getAllUsers();

        // Then
        assertEquals(2, result.size());
        assertEquals("testuser", result.get(0).username());
        assertEquals("user2", result.get(1).username());

        verify(userRepository).findAll();
    }

    @Test
    void getUserCount() {
        // Given
        when(userRepository.count()).thenReturn(5L);

        // When
        long result = userService.getUserCount();

        // Then
        assertEquals(5L, result);
        verify(userRepository).count();
    }

    @Test
    void findById_NullId() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> userService.findById(null));
        verify(userRepository, never()).findById(any());
    }

    @Test
    void findByEmail_NullEmail() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> userService.findByEmail(null));
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void findByEmail_EmptyEmail() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> userService.findByEmail(""));
        verify(userRepository, never()).findByEmail(any());
    }

    @Test
    void findByUsername_NullUsername() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> userService.findByUsername(null));
        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    void findByUsername_EmptyUsername() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> userService.findByUsername(""));
        verify(userRepository, never()).findByUsername(any());
    }

    @Test
    void convertToUserResponse_WithPreferences() {
        // Given
        testUser.setPreferences(testPreferences);

        // When
        UserResponse result = userService.convertToUserResponse(testUser);

        // Then
        assertNotNull(result);
        assertEquals(testUserId, result.id());
        assertEquals("testuser", result.username());
        assertEquals("test@example.com", result.email());
        assertNotNull(result.preferences());
        assertEquals(ExperienceLevel.INTERMEDIATE, result.preferences().experienceLevel());
    }

    @Test
    void convertToUserResponse_WithoutPreferences() {
        // When
        UserResponse result = userService.convertToUserResponse(testUser);

        // Then
        assertNotNull(result);
        assertEquals(testUserId, result.id());
        assertEquals("testuser", result.username());
        assertEquals("test@example.com", result.email());
        assertNull(result.preferences());
    }

    @Test
    void convertToUserResponse_NullUser() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> userService.convertToUserResponse(null));
    }
} 