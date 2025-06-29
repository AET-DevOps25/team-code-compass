package com.flexfit.workoutplanservice.service;

import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.dto.WorkoutPlanGenerationRequest;
import com.flexfit.workoutplanservice.dto.gains.GenAIResponse;
import com.flexfit.workoutplanservice.dto.gains.GenAIDailyWorkout;
import com.flexfit.workoutplanservice.dto.gains.GenAIExercise;
import com.flexfit.workoutplanservice.dto.gains.PromptContext;
import com.flexfit.workoutplanservice.dto.user.UserResponse;
import com.flexfit.workoutplanservice.dto.user.UserPreferencesResponse;
import com.flexfit.workoutplanservice.model.DailyWorkout;
import com.flexfit.workoutplanservice.model.ScheduledExercise;
import com.flexfit.workoutplanservice.model.enums.CompletionStatus;
import com.flexfit.workoutplanservice.model.enums.SportType;
import com.flexfit.workoutplanservice.repository.DailyWorkoutRepository;
import com.flexfit.workoutplanservice.repository.ScheduledExerciseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkoutPlanServiceTest {

    @Mock
    private DailyWorkoutRepository dailyWorkoutRepository;

    @Mock
    private ScheduledExerciseRepository scheduledExerciseRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private WorkoutPlanMapper workoutPlanMapper;

    @InjectMocks
    private WorkoutPlanService workoutPlanService;

    private WorkoutPlanGenerationRequest testRequest;
    private UserResponse testUser;
    private UserPreferencesResponse testPreferences;
    private GenAIResponse testGenAIResponse;
    private DailyWorkout testDailyWorkout;
    private ScheduledExercise testExercise;

    @BeforeEach
    void setUp() {
        UUID testUserId = UUID.randomUUID();
        
        testRequest = new WorkoutPlanGenerationRequest();
        testRequest.setUserId(testUserId);
        testRequest.setDayDate(LocalDate.of(2025, 6, 29));
        testRequest.setFocusSportType(SportType.STRENGTH);
        testRequest.setTargetDurationMinutes(45);

        testPreferences = new UserPreferencesResponse(
            "INTERMEDIATE",
            List.of("MUSCLE_GAIN"),
            List.of("STRENGTH"),
            List.of("DUMBBELLS"),
            "30-45 minutes",
            "MODERATE",
            "No injuries",
            List.of()
        );

        testUser = new UserResponse(
            testUserId,
            "testuser",
            "test@example.com",
            "Test",
            "User",
            LocalDate.of(1990, 1, 1),
            33,
            "MALE",
            180,
            75,
            testPreferences
        );

        GenAIExercise genAIExercise = new GenAIExercise(
            1,
            "Push-ups",
            "Classic push-up exercise",
            List.of("STRENGTH"),
            List.of("Chest", "Triceps"),
            List.of("Shoulders"),
            List.of("NO_EQUIPMENT"),
            "BEGINNER",
            "3 sets of 10-15 reps",
            "Keep your body straight",
            "https://example.com/pushup-video"
        );

        GenAIDailyWorkout genAIDailyWorkout = new GenAIDailyWorkout(
            "2025-06-29",
            "STRENGTH",
            45,
            List.of(genAIExercise)
        );

        testGenAIResponse = new GenAIResponse(genAIDailyWorkout);

        testDailyWorkout = new DailyWorkout();
        testDailyWorkout.setId(UUID.randomUUID());
        testDailyWorkout.setUserId(testUserId);
        testDailyWorkout.setDayDate(LocalDate.of(2025, 6, 29));
        testDailyWorkout.setFocusSportType(SportType.STRENGTH);
        testDailyWorkout.setTargetDurationMinutes(45);
        testDailyWorkout.setCompletionStatus(CompletionStatus.NOT_STARTED);

        testExercise = new ScheduledExercise();
        testExercise.setId(UUID.randomUUID());
        testExercise.setDailyWorkout(testDailyWorkout);
        testExercise.setSequenceOrder(1);
        testExercise.setExerciseName("Push-ups");
        testExercise.setDescription("Classic push-up exercise");
        testExercise.setApplicableSportTypes(List.of(SportType.STRENGTH));
        testExercise.setMuscleGroupsPrimary(List.of("Chest", "Triceps"));
        testExercise.setMuscleGroupsSecondary(List.of("Shoulders"));
        testExercise.setEquipmentNeeded(List.of("NO_EQUIPMENT"));
        testExercise.setDifficulty("BEGINNER");
        testExercise.setPrescribedSetsRepsDuration("3 sets of 10-15 reps");
        testExercise.setVoiceScriptCueText("Keep your body straight");
        testExercise.setVideoUrl("https://example.com/pushup-video");
    }

    @Test
    void generateWorkoutPlan_Success() {
        // Given
        when(restTemplate.getForObject(anyString(), eq(UserResponse.class)))
            .thenReturn(testUser);
        when(restTemplate.postForObject(anyString(), any(PromptContext.class), eq(GenAIResponse.class)))
            .thenReturn(testGenAIResponse);
        when(workoutPlanMapper.mapToDailyWorkout(any(GenAIDailyWorkout.class), eq(testRequest)))
            .thenReturn(testDailyWorkout);
        when(workoutPlanMapper.mapToScheduledExercises(anyList(), eq(testDailyWorkout)))
            .thenReturn(List.of(testExercise));
        when(dailyWorkoutRepository.save(any(DailyWorkout.class)))
            .thenReturn(testDailyWorkout);
        when(scheduledExerciseRepository.saveAll(anyList()))
            .thenReturn(List.of(testExercise));

        // When
        DailyWorkoutResponse result = workoutPlanService.generateWorkoutPlan(testRequest);

        // Then
        assertNotNull(result);
        assertEquals(testRequest.getUserId(), result.getUserId());
        assertEquals(testRequest.getDayDate(), result.getDayDate());
        assertEquals(SportType.STRENGTH, result.getFocusSportType());
        assertEquals(45, result.getTargetDurationMinutes());
        assertEquals(1, result.getScheduledExercises().size());
        assertEquals("Push-ups", result.getScheduledExercises().get(0).getExerciseName());

        verify(restTemplate).getForObject(anyString(), eq(UserResponse.class));
        verify(restTemplate).postForObject(anyString(), any(PromptContext.class), eq(GenAIResponse.class));
        verify(dailyWorkoutRepository).save(any(DailyWorkout.class));
        verify(scheduledExerciseRepository).saveAll(anyList());
    }

    @Test
    void generateWorkoutPlan_UserNotFound() {
        // Given
        when(restTemplate.getForObject(anyString(), eq(UserResponse.class)))
            .thenReturn(null);

        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> workoutPlanService.generateWorkoutPlan(testRequest)
        );
        assertTrue(exception.getMessage().contains("User not found"));

        verify(restTemplate).getForObject(anyString(), eq(UserResponse.class));
        verify(restTemplate, never()).postForObject(anyString(), any(), any());
        verify(dailyWorkoutRepository, never()).save(any());
    }

    @Test
    void generateWorkoutPlan_GenAIServiceFailure() {
        // Given
        when(restTemplate.getForObject(anyString(), eq(UserResponse.class)))
            .thenReturn(testUser);
        when(restTemplate.postForObject(anyString(), any(PromptContext.class), eq(GenAIResponse.class)))
            .thenThrow(new RuntimeException("GenAI service unavailable"));

        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> workoutPlanService.generateWorkoutPlan(testRequest)
        );
        assertTrue(exception.getMessage().contains("GenAI service unavailable"));

        verify(restTemplate).getForObject(anyString(), eq(UserResponse.class));
        verify(restTemplate).postForObject(anyString(), any(PromptContext.class), eq(GenAIResponse.class));
        verify(dailyWorkoutRepository, never()).save(any());
    }

    @Test
    void generateWorkoutPlan_DatabaseSaveFailure() {
        // Given
        when(restTemplate.getForObject(anyString(), eq(UserResponse.class)))
            .thenReturn(testUser);
        when(restTemplate.postForObject(anyString(), any(PromptContext.class), eq(GenAIResponse.class)))
            .thenReturn(testGenAIResponse);
        when(workoutPlanMapper.mapToDailyWorkout(any(GenAIDailyWorkout.class), eq(testRequest)))
            .thenReturn(testDailyWorkout);
        when(workoutPlanMapper.mapToScheduledExercises(anyList(), eq(testDailyWorkout)))
            .thenReturn(List.of(testExercise));
        when(dailyWorkoutRepository.save(any(DailyWorkout.class)))
            .thenThrow(new RuntimeException("Database connection failed"));

        // When & Then
        RuntimeException exception = assertThrows(
            RuntimeException.class,
            () -> workoutPlanService.generateWorkoutPlan(testRequest)
        );
        assertTrue(exception.getMessage().contains("Database connection failed"));

        verify(dailyWorkoutRepository).save(any(DailyWorkout.class));
        verify(scheduledExerciseRepository, never()).saveAll(anyList());
    }

    @Test
    void generateWorkoutPlan_NullRequest() {
        // When & Then
        assertThrows(
            IllegalArgumentException.class,
            () -> workoutPlanService.generateWorkoutPlan(null)
        );

        verify(restTemplate, never()).getForObject(anyString(), any());
    }

    @Test
    void generateWorkoutPlan_InvalidUserId() {
        // Given
        testRequest.setUserId(null);

        // When & Then
        assertThrows(
            IllegalArgumentException.class,
            () -> workoutPlanService.generateWorkoutPlan(testRequest)
        );

        verify(restTemplate, never()).getForObject(anyString(), any());
    }

    @Test
    void generateWorkoutPlan_InvalidDate() {
        // Given
        testRequest.setDayDate(null);

        // When & Then
        assertThrows(
            IllegalArgumentException.class,
            () -> workoutPlanService.generateWorkoutPlan(testRequest)
        );

        verify(restTemplate, never()).getForObject(anyString(), any());
    }

    @Test
    void generateWorkoutPlan_InvalidSportType() {
        // Given
        testRequest.setFocusSportType(null);

        // When & Then
        assertThrows(
            IllegalArgumentException.class,
            () -> workoutPlanService.generateWorkoutPlan(testRequest)
        );

        verify(restTemplate, never()).getForObject(anyString(), any());
    }

    @Test
    void generateWorkoutPlan_InvalidDuration() {
        // Given
        testRequest.setTargetDurationMinutes(0);

        // When & Then
        assertThrows(
            IllegalArgumentException.class,
            () -> workoutPlanService.generateWorkoutPlan(testRequest)
        );

        verify(restTemplate, never()).getForObject(anyString(), any());
    }

    @Test
    void generateWorkoutPlan_HIITSportType() {
        // Given
        testRequest.setFocusSportType(SportType.HIIT);
        testRequest.setTargetDurationMinutes(30);

        GenAIExercise hiitExercise = new GenAIExercise(
            1,
            "Burpees",
            "High-intensity burpee exercise",
            List.of("HIIT"),
            List.of("Full Body"),
            List.of(),
            List.of("NO_EQUIPMENT"),
            "INTERMEDIATE",
            "3 sets of 30 seconds",
            "Explosive movement",
            "https://example.com/burpee-video"
        );

        GenAIDailyWorkout hiitWorkout = new GenAIDailyWorkout(
            "2025-06-29",
            "HIIT",
            30,
            List.of(hiitExercise)
        );

        GenAIResponse hiitResponse = new GenAIResponse(hiitWorkout);

        when(restTemplate.getForObject(anyString(), eq(UserResponse.class)))
            .thenReturn(testUser);
        when(restTemplate.postForObject(anyString(), any(PromptContext.class), eq(GenAIResponse.class)))
            .thenReturn(hiitResponse);
        when(workoutPlanMapper.mapToDailyWorkout(any(GenAIDailyWorkout.class), eq(testRequest)))
            .thenReturn(testDailyWorkout);
        when(workoutPlanMapper.mapToScheduledExercises(anyList(), eq(testDailyWorkout)))
            .thenReturn(List.of(testExercise));
        when(dailyWorkoutRepository.save(any(DailyWorkout.class)))
            .thenReturn(testDailyWorkout);
        when(scheduledExerciseRepository.saveAll(anyList()))
            .thenReturn(List.of(testExercise));

        // When
        DailyWorkoutResponse result = workoutPlanService.generateWorkoutPlan(testRequest);

        // Then
        assertNotNull(result);
        assertEquals(SportType.HIIT, testRequest.getFocusSportType());
        assertEquals(30, testRequest.getTargetDurationMinutes());

        verify(restTemplate).postForObject(anyString(), argThat(context -> {
            Map<String, Object> dailyFocus = ((PromptContext) context).dailyFocus();
            return "HIIT".equals(dailyFocus.get("focus_sport_type_for_the_day")) &&
                   Integer.valueOf(30).equals(dailyFocus.get("target_total_duration_minutes"));
        }), eq(GenAIResponse.class));
    }

    @Test
    void generateWorkoutPlan_UserServiceURL() {
        // Given
        String expectedUrl = "http://user-service:8081/api/v1/users/" + testRequest.getUserId();
        when(restTemplate.getForObject(eq(expectedUrl), eq(UserResponse.class)))
            .thenReturn(testUser);
        when(restTemplate.postForObject(anyString(), any(PromptContext.class), eq(GenAIResponse.class)))
            .thenReturn(testGenAIResponse);
        when(workoutPlanMapper.mapToDailyWorkout(any(GenAIDailyWorkout.class), eq(testRequest)))
            .thenReturn(testDailyWorkout);
        when(workoutPlanMapper.mapToScheduledExercises(anyList(), eq(testDailyWorkout)))
            .thenReturn(List.of(testExercise));
        when(dailyWorkoutRepository.save(any(DailyWorkout.class)))
            .thenReturn(testDailyWorkout);
        when(scheduledExerciseRepository.saveAll(anyList()))
            .thenReturn(List.of(testExercise));

        // When
        workoutPlanService.generateWorkoutPlan(testRequest);

        // Then
        verify(restTemplate).getForObject(eq(expectedUrl), eq(UserResponse.class));
    }

    @Test
    void generateWorkoutPlan_GenAIServiceURL() {
        // Given
        String expectedUrl = "http://genai-workout-worker:8083/generate";
        when(restTemplate.getForObject(anyString(), eq(UserResponse.class)))
            .thenReturn(testUser);
        when(restTemplate.postForObject(eq(expectedUrl), any(PromptContext.class), eq(GenAIResponse.class)))
            .thenReturn(testGenAIResponse);
        when(workoutPlanMapper.mapToDailyWorkout(any(GenAIDailyWorkout.class), eq(testRequest)))
            .thenReturn(testDailyWorkout);
        when(workoutPlanMapper.mapToScheduledExercises(anyList(), eq(testDailyWorkout)))
            .thenReturn(List.of(testExercise));
        when(dailyWorkoutRepository.save(any(DailyWorkout.class)))
            .thenReturn(testDailyWorkout);
        when(scheduledExerciseRepository.saveAll(anyList()))
            .thenReturn(List.of(testExercise));

        // When
        workoutPlanService.generateWorkoutPlan(testRequest);

        // Then
        verify(restTemplate).postForObject(eq(expectedUrl), any(PromptContext.class), eq(GenAIResponse.class));
    }

    @Test
    void buildPromptContext_Success() {
        // Given
        testUser = new UserResponse(
            testRequest.getUserId(),
            "testuser",
            "test@example.com",
            "Test",
            "User",
            LocalDate.of(1990, 1, 1),
            33,
            "MALE",
            180,
            75,
            testPreferences
        );

        // When
        PromptContext result = workoutPlanService.buildPromptContext(testUser, testRequest);

        // Then
        assertNotNull(result);
        assertNotNull(result.userProfile());
        assertNotNull(result.userPreferences());
        assertNotNull(result.dailyFocus());

        Map<String, Object> userProfile = result.userProfile();
        assertEquals(33, userProfile.get("age"));
        assertEquals("MALE", userProfile.get("gender"));
        assertEquals(180, userProfile.get("height_cm"));
        assertEquals(75, userProfile.get("weight_kg"));

        Map<String, Object> dailyFocus = result.dailyFocus();
        assertEquals("2025-06-29", dailyFocus.get("day_date"));
        assertEquals("STRENGTH", dailyFocus.get("focus_sport_type_for_the_day"));
        assertEquals(45, dailyFocus.get("target_total_duration_minutes"));
    }

    @Test
    void buildPromptContext_WithNullValues() {
        // Given
        UserResponse userWithNulls = new UserResponse(
            testRequest.getUserId(),
            "testuser",
            "test@example.com",
            "Test",
            "User",
            LocalDate.of(1990, 1, 1),
            33,
            "MALE",
            null, // height is null
            null, // weight is null
            testPreferences
        );

        // When
        PromptContext result = workoutPlanService.buildPromptContext(userWithNulls, testRequest);

        // Then
        assertNotNull(result);
        Map<String, Object> userProfile = result.userProfile();
        assertEquals(33, userProfile.get("age"));
        assertEquals("MALE", userProfile.get("gender"));
        assertEquals("Unknown", userProfile.get("height_cm"));
        assertEquals("Unknown", userProfile.get("weight_kg"));
    }

    @Test
    void buildPromptContext_WithNullPreferences() {
        // Given
        UserResponse userWithoutPreferences = new UserResponse(
            testRequest.getUserId(),
            "testuser",
            "test@example.com",
            "Test",
            "User",
            LocalDate.of(1990, 1, 1),
            33,
            "MALE",
            180,
            75,
            null // preferences is null
        );

        // When
        PromptContext result = workoutPlanService.buildPromptContext(userWithoutPreferences, testRequest);

        // Then
        assertNotNull(result);
        assertNull(result.userPreferences());
    }
} 