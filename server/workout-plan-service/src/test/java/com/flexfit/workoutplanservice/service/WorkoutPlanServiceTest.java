package com.flexfit.workoutplanservice.service;

import com.flexfit.workoutplanservice.dto.WorkoutPlanGenerationRequest;
import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.model.DailyWorkout;
import com.flexfit.workoutplanservice.model.enums.SportType;
import com.flexfit.workoutplanservice.repository.DailyWorkoutRepository;
import com.flexfit.workoutplanservice.repository.ScheduledExerciseRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import com.flexfit.workoutplanservice.dto.user.UserResponse;
import com.flexfit.workoutplanservice.dto.user.UserPreferencesResponse;
import com.flexfit.workoutplanservice.dto.gains.GenAIResponse;
import com.flexfit.workoutplanservice.dto.gains.GenAIDailyWorkout;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class WorkoutPlanServiceTest {

    @Mock
    private DailyWorkoutRepository dailyWorkoutRepository;

    @Mock
    private ScheduledExerciseRepository scheduledExerciseRepository;

    @Mock
    private WorkoutPlanMapper mapper;

    @Mock
    private RestTemplate userSvcRestTemplate;

    @Mock
    private RestTemplate genaiCloudRestTemplate;
    
    @Mock
    private RestTemplate genaiLocalRestTemplate;

    private WorkoutPlanService workoutPlanService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        workoutPlanService = new WorkoutPlanService(
            dailyWorkoutRepository,
            scheduledExerciseRepository,
            mapper,
            userSvcRestTemplate,
            genaiCloudRestTemplate,
            genaiLocalRestTemplate
        );
    }

    @Test
    @DisplayName("Should instantiate service with all dependencies")
    void serviceInstantiation_Success() {
        // When & Then
        assertNotNull(workoutPlanService);
        assertNotNull(dailyWorkoutRepository);
        assertNotNull(mapper);
        assertNotNull(userSvcRestTemplate);
        assertNotNull(genaiCloudRestTemplate);
        assertNotNull(genaiLocalRestTemplate);
    }

    @Test
    @DisplayName("Should use cloud GenAI service when aiPreference is 'cloud'")
    void generateWorkoutPlan_WithCloudAI_Success() {
        // Given
        UUID userId = UUID.randomUUID();
        LocalDate today = LocalDate.now();
        WorkoutPlanGenerationRequest request = new WorkoutPlanGenerationRequest();
        request.setUserId(userId);
        request.setDayDate(today);
        request.setFocusSportType(SportType.STRENGTH);
        request.setTargetDurationMinutes(45);
        request.setTextPrompt("Upper body strength workout");
        request.setAiPreference("cloud");
        
        String bearerToken = "Bearer test-token";
        
        // Mock user service response
        UserPreferencesResponse mockPreferences = new UserPreferencesResponse(
            "INTERMEDIATE", null, null, null, null, null, null, null
        );
        UserResponse mockUser = new UserResponse(
            request.getUserId(), "testuser", "test@example.com", 
            LocalDate.of(1990, 1, 1), 180, 75.0, "M", mockPreferences
        );
        when(userSvcRestTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(UserResponse.class), any(UUID.class)))
            .thenReturn(new ResponseEntity<>(mockUser, HttpStatus.OK));
            
        // Mock cloud GenAI service response
        GenAIDailyWorkout mockDailyWorkout = new GenAIDailyWorkout(
            LocalDate.now().toString(), "STRENGTH", List.of(), "Test workout plan"
        );
        GenAIResponse mockGenAIResponse = new GenAIResponse(mockDailyWorkout);
        when(genaiCloudRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class)))
            .thenReturn(new ResponseEntity<>(mockGenAIResponse, HttpStatus.OK));
            
        // Mock repository save
        DailyWorkout mockWorkout = new DailyWorkout();
        mockWorkout.setId(UUID.randomUUID());
        when(dailyWorkoutRepository.save(any(DailyWorkout.class))).thenReturn(mockWorkout);
        
        // Mock mapper
        DailyWorkoutResponse mockResponse = new DailyWorkoutResponse();
        when(mapper.toDailyWorkoutResponse(any(DailyWorkout.class))).thenReturn(mockResponse);

        // When
        DailyWorkoutResponse result = workoutPlanService.generateWorkoutPlan(request, bearerToken);

        // Then
        assertNotNull(result);
        verify(genaiCloudRestTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
        verify(genaiLocalRestTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
        verify(dailyWorkoutRepository, times(1)).save(any(DailyWorkout.class));
    }

    @Test
    @DisplayName("Should use local GenAI service when aiPreference is 'local'")
    void generateWorkoutPlan_WithLocalAI_Success() {
        // Given
        UUID userId = UUID.randomUUID();
        LocalDate today = LocalDate.now();
        WorkoutPlanGenerationRequest request = new WorkoutPlanGenerationRequest();
        request.setUserId(userId);
        request.setDayDate(today);
        request.setFocusSportType(SportType.STRENGTH);
        request.setTargetDurationMinutes(45);
        request.setTextPrompt("Upper body strength workout");
        request.setAiPreference("local");
        
        String bearerToken = "Bearer test-token";
        
        // Mock user service response
        UserPreferencesResponse mockPreferences = new UserPreferencesResponse(
            "INTERMEDIATE", null, null, null, null, null, null, null
        );
        UserResponse mockUser = new UserResponse(
            request.getUserId(), "testuser", "test@example.com", 
            LocalDate.of(1990, 1, 1), 180, 75.0, "M", mockPreferences
        );
        when(userSvcRestTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(UserResponse.class), any(UUID.class)))
            .thenReturn(new ResponseEntity<>(mockUser, HttpStatus.OK));
            
        // Mock local GenAI service response
        GenAIDailyWorkout mockDailyWorkout = new GenAIDailyWorkout(
            LocalDate.now().toString(), "STRENGTH", List.of(), "Test local workout plan"
        );
        GenAIResponse mockGenAIResponse = new GenAIResponse(mockDailyWorkout);
        when(genaiLocalRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class)))
            .thenReturn(new ResponseEntity<>(mockGenAIResponse, HttpStatus.OK));
            
        // Mock repository save
        DailyWorkout mockWorkout = new DailyWorkout();
        mockWorkout.setId(UUID.randomUUID());
        when(dailyWorkoutRepository.save(any(DailyWorkout.class))).thenReturn(mockWorkout);
        
        // Mock mapper
        DailyWorkoutResponse mockResponse = new DailyWorkoutResponse();
        when(mapper.toDailyWorkoutResponse(any(DailyWorkout.class))).thenReturn(mockResponse);

        // When
        DailyWorkoutResponse result = workoutPlanService.generateWorkoutPlan(request, bearerToken);

        // Then
        assertNotNull(result);
        verify(genaiLocalRestTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
        verify(genaiCloudRestTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
        verify(dailyWorkoutRepository, times(1)).save(any(DailyWorkout.class));
    }

    @Test
    @DisplayName("Should default to cloud GenAI service when aiPreference is null or invalid")
    void generateWorkoutPlan_WithNullAIPreference_DefaultsToCloud() {
        // Given
        UUID userId = UUID.randomUUID();
        LocalDate today = LocalDate.now();
        WorkoutPlanGenerationRequest request = new WorkoutPlanGenerationRequest();
        request.setUserId(userId);
        request.setDayDate(today);
        request.setFocusSportType(SportType.STRENGTH);
        request.setTargetDurationMinutes(45);
        request.setTextPrompt("Upper body strength workout");
        request.setAiPreference(null); // null preference should default to cloud
        
        String bearerToken = "Bearer test-token";
        
        // Mock user service response
        UserPreferencesResponse mockPreferences = new UserPreferencesResponse(
            "INTERMEDIATE", null, null, null, null, null, null, null
        );
        UserResponse mockUser = new UserResponse(
            request.getUserId(), "testuser", "test@example.com", 
            LocalDate.of(1990, 1, 1), 180, 75.0, "M", mockPreferences
        );
        when(userSvcRestTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(UserResponse.class), any(UUID.class)))
            .thenReturn(new ResponseEntity<>(mockUser, HttpStatus.OK));
            
        // Mock cloud GenAI service response
        GenAIDailyWorkout mockDailyWorkout = new GenAIDailyWorkout(
            LocalDate.now().toString(), "STRENGTH", List.of(), "Test workout plan for null preference"
        );
        GenAIResponse mockGenAIResponse = new GenAIResponse(mockDailyWorkout);
        when(genaiCloudRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class)))
            .thenReturn(new ResponseEntity<>(mockGenAIResponse, HttpStatus.OK));
            
        // Mock repository save
        DailyWorkout mockWorkout = new DailyWorkout();
        mockWorkout.setId(UUID.randomUUID());
        when(dailyWorkoutRepository.save(any(DailyWorkout.class))).thenReturn(mockWorkout);
        
        // Mock mapper
        DailyWorkoutResponse mockResponse = new DailyWorkoutResponse();
        when(mapper.toDailyWorkoutResponse(any(DailyWorkout.class))).thenReturn(mockResponse);

        // When
        DailyWorkoutResponse result = workoutPlanService.generateWorkoutPlan(request, bearerToken);

        // Then
        assertNotNull(result);
        verify(genaiCloudRestTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
        verify(genaiLocalRestTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
    }

    @Test
    @DisplayName("Should handle invalid aiPreference values gracefully")
    void generateWorkoutPlan_WithInvalidAIPreference_DefaultsToCloud() {
        // Given
        UUID userId = UUID.randomUUID();
        LocalDate today = LocalDate.now();
        WorkoutPlanGenerationRequest request = new WorkoutPlanGenerationRequest();
        request.setUserId(userId);
        request.setDayDate(today);
        request.setFocusSportType(SportType.STRENGTH);
        request.setTargetDurationMinutes(45);
        request.setTextPrompt("Upper body strength workout");
        request.setAiPreference("invalid_preference"); // Invalid preference should default to cloud
        
        String bearerToken = "Bearer test-token";
        
        // Mock user service response
        UserPreferencesResponse mockPreferences = new UserPreferencesResponse(
            "INTERMEDIATE", null, null, null, null, null, null, null
        );
        UserResponse mockUser = new UserResponse(
            request.getUserId(), "testuser", "test@example.com", 
            LocalDate.of(1990, 1, 1), 180, 75.0, "M", mockPreferences
        );
        when(userSvcRestTemplate.exchange(anyString(), eq(HttpMethod.GET), any(HttpEntity.class), eq(UserResponse.class), any(UUID.class)))
            .thenReturn(new ResponseEntity<>(mockUser, HttpStatus.OK));
            
        // Mock cloud GenAI service response
        GenAIDailyWorkout mockDailyWorkout = new GenAIDailyWorkout(
            LocalDate.now().toString(), "STRENGTH", List.of(), "Test workout plan for invalid preference"
        );
        GenAIResponse mockGenAIResponse = new GenAIResponse(mockDailyWorkout);
        when(genaiCloudRestTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class)))
            .thenReturn(new ResponseEntity<>(mockGenAIResponse, HttpStatus.OK));
            
        // Mock repository save
        DailyWorkout mockWorkout = new DailyWorkout();
        mockWorkout.setId(UUID.randomUUID());
        when(dailyWorkoutRepository.save(any(DailyWorkout.class))).thenReturn(mockWorkout);
        
        // Mock mapper
        DailyWorkoutResponse mockResponse = new DailyWorkoutResponse();
        when(mapper.toDailyWorkoutResponse(any(DailyWorkout.class))).thenReturn(mockResponse);

        // When
        DailyWorkoutResponse result = workoutPlanService.generateWorkoutPlan(request, bearerToken);

        // Then
        assertNotNull(result);
        verify(genaiCloudRestTemplate, times(1)).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
        verify(genaiLocalRestTemplate, never()).exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(GenAIResponse.class));
    }
} 