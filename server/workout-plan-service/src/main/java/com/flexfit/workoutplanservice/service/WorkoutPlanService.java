package com.flexfit.workoutplanservice.service;

import com.flexfit.workoutplanservice.dto.WorkoutPlanGenerationRequest;
import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.dto.gains.GenAIResponse;
import com.flexfit.workoutplanservice.dto.gains.GenAIDailyWorkout;
import com.flexfit.workoutplanservice.dto.gains.PromptContext;
import com.flexfit.workoutplanservice.dto.user.UserResponse;
import com.flexfit.workoutplanservice.model.DailyWorkout;
import com.flexfit.workoutplanservice.model.ScheduledExercise;
import com.flexfit.workoutplanservice.model.enums.SportType;
import com.flexfit.workoutplanservice.repository.DailyWorkoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Period;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutPlanService {

    private final DailyWorkoutRepository dailyWorkoutRepository;
    private final WorkoutPlanMapper mapper;

    @Qualifier("userSvcRestTemplate")
    private final RestTemplate userSvcRestTemplate;

    @Qualifier("genaiSvcRestTemplate")
    private final RestTemplate genaiSvcRestTemplate;

    @Transactional
    public DailyWorkoutResponse generateWorkoutPlan(WorkoutPlanGenerationRequest request, String bearerToken) {
        // Step 1: Call user-service to get the user's full profile
        UserResponse user = getUserProfile(request.getUserId(), bearerToken);
        if (user == null) {
            throw new IllegalStateException("User not found or unable to fetch profile.");
        }

        // Step 2: Build the prompt context for the GenAI worker
        PromptContext promptContext = buildPromptContext(user, request);

        // Step 3: Call the Python genai-service with the prompt
        GenAIResponse genAIResponse = callGenAIWorker(promptContext, bearerToken);
        if (genAIResponse == null || genAIResponse.daily_workout() == null) {
            throw new IllegalStateException("Failed to generate workout plan from GenAI service.");
        }

        // Step 4: Create and save the workout entities from the GenAI response
        DailyWorkout dailyWorkout = persistWorkoutPlan(request, genAIResponse);

        // Step 5: Map the saved entity to a response DTO and return
        return mapper.toDailyWorkoutResponse(dailyWorkout);
    }

    private UserResponse getUserProfile(java.util.UUID userId, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", bearerToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            ResponseEntity<UserResponse> response = userSvcRestTemplate.exchange(
                    "/api/v1/users/{id}", HttpMethod.GET, entity, UserResponse.class, userId);
            return response.getBody();
        } catch (Exception e) {
            System.err.println("Error fetching user profile: " + e.getMessage());
            return null;
        }
    }

    private PromptContext buildPromptContext(UserResponse user, WorkoutPlanGenerationRequest request) {
        int age = Period.between(user.dateOfBirth(), java.time.LocalDate.now()).getYears();
        
        Map<String, Object> userProfileMap = Map.of(
            "age", age,
            "gender", user.gender() != null ? user.gender() : "UNKNOWN",
            "height_cm", user.heightCm() != null ? user.heightCm() : 180,
            "weight_kg", user.weightKg() != null ? user.weightKg() : 75
        );
        
        Map<String, Object> dailyFocusMap = Map.of(
            "day_date", request.getDayDate().toString(),
            "focus_sport_type_for_the_day", request.getFocusSportType().toString(),
            "target_total_duration_minutes", request.getTargetDurationMinutes()
        );

        return new PromptContext(userProfileMap, user.preferences(), dailyFocusMap);
    }
    
    private GenAIResponse callGenAIWorker(PromptContext context, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", bearerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<PromptContext> entity = new HttpEntity<>(context, headers);
        
        try {
            ResponseEntity<GenAIResponse> response = genaiSvcRestTemplate.exchange(
                "/generate", HttpMethod.POST, entity, GenAIResponse.class);
            return response.getBody();
        } catch(Exception e) {
            System.err.println("Error calling GenAI worker: " + e.getMessage());
            return null;
        }
    }

    private DailyWorkout persistWorkoutPlan(WorkoutPlanGenerationRequest request, GenAIResponse genAIResponse) {
        GenAIDailyWorkout aiWorkout = genAIResponse.daily_workout();
        
        DailyWorkout dailyWorkout = new DailyWorkout();
        dailyWorkout.setUserId(request.getUserId());
        dailyWorkout.setDayDate(request.getDayDate());
        dailyWorkout.setFocusSportTypeForTheDay(request.getFocusSportType());
        
        List<ScheduledExercise> exercises = aiWorkout.scheduled_exercises().stream().map(aiExercise -> {
            ScheduledExercise exercise = new ScheduledExercise();
            exercise.setSequenceOrder(aiExercise.sequence_order());
            exercise.setExerciseName(aiExercise.exercise_name());
            exercise.setDescription(aiExercise.description());
            exercise.setApplicableSportTypes(aiExercise.applicable_sport_types().stream().map(SportType::valueOf).collect(Collectors.toList()));
            exercise.setMuscleGroupsPrimary(aiExercise.muscle_groups_primary());
            exercise.setMuscleGroupsSecondary(aiExercise.muscle_groups_secondary());
            exercise.setEquipmentNeeded(aiExercise.equipment_needed().stream().map(com.flexfit.workoutplanservice.model.enums.EquipmentItem::valueOf).collect(Collectors.toList()));
            exercise.setDifficulty(aiExercise.difficulty());
            exercise.setPrescribedSetsRepsDuration(aiExercise.prescribed_sets_reps_duration());
            exercise.setVoiceScriptCueText(aiExercise.voice_script_cue_text());
            exercise.setVideoUrl(aiExercise.video_url());
            return exercise;
        }).collect(Collectors.toList());
        
        dailyWorkout.setScheduledExercises(exercises);

        return dailyWorkoutRepository.save(dailyWorkout);
    }
}
