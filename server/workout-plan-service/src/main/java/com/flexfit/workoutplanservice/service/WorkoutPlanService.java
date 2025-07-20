package com.flexfit.workoutplanservice.service;

import com.flexfit.workoutplanservice.dto.WorkoutPlanGenerationRequest;
import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.dto.gains.GenAIResponse;
import com.flexfit.workoutplanservice.dto.gains.GenAIDailyWorkout;
import com.flexfit.workoutplanservice.dto.gains.GenAIWeeklyResponse;
import com.flexfit.workoutplanservice.dto.gains.PromptContext;
import com.flexfit.workoutplanservice.dto.gains.WeeklyPromptContext;
import com.flexfit.workoutplanservice.dto.user.UserResponse;
import com.flexfit.workoutplanservice.model.DailyWorkout;
import com.flexfit.workoutplanservice.model.ScheduledExercise;
import com.flexfit.workoutplanservice.model.enums.SportType;
import com.flexfit.workoutplanservice.model.enums.EquipmentItem;
import com.flexfit.workoutplanservice.repository.DailyWorkoutRepository;
import com.flexfit.workoutplanservice.repository.ScheduledExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.flexfit.workoutplanservice.model.enums.CompletionStatus;

@Service
@RequiredArgsConstructor
public class WorkoutPlanService {

    private final DailyWorkoutRepository dailyWorkoutRepository;
    private final ScheduledExerciseRepository scheduledExerciseRepository;
    private final WorkoutPlanMapper mapper;
    private final Logger logger = LoggerFactory.getLogger(WorkoutPlanService.class);

    @Qualifier("userSvcRestTemplate")
    private final RestTemplate userSvcRestTemplate;

    @Qualifier("genaiCloudRestTemplate")
    private final RestTemplate genaiCloudRestTemplate;
    
    @Qualifier("genaiLocalRestTemplate")
    private final RestTemplate genaiLocalRestTemplate;

    // Helper methods for safe enum parsing
    private SportType parseSportType(String sportTypeStr) {
        try {
            return SportType.valueOf(sportTypeStr);
        } catch (IllegalArgumentException e) {
            logger.warn("Unknown sport type '{}', defaulting to STRENGTH", sportTypeStr);
            return SportType.STRENGTH;
        }
    }

    private EquipmentItem parseEquipmentItem(String equipmentStr) {
        try {
            return EquipmentItem.valueOf(equipmentStr);
        } catch (IllegalArgumentException e) {
            logger.warn("Unknown equipment item '{}', defaulting to NO_EQUIPMENT", equipmentStr);
            return EquipmentItem.NO_EQUIPMENT;
        }
    }

    private List<SportType> parseSportTypes(List<String> sportTypes) {
        return sportTypes.stream()
                .map(this::parseSportType)
                .collect(Collectors.toList());
    }

    private List<EquipmentItem> parseEquipmentItems(List<String> equipmentItems) {
        return equipmentItems.stream()
                .map(this::parseEquipmentItem)
                .collect(Collectors.toList());
    }

    @Transactional
    public DailyWorkoutResponse generateWorkoutPlan(WorkoutPlanGenerationRequest request, String bearerToken) {
        // Step 1: Call user-service to get the user's full profile
        UserResponse user = getUserProfile(request.getUserId(), bearerToken);
        if (user == null) {
            throw new IllegalStateException("User not found or unable to fetch profile.");
        }

        // Step 2: Build the prompt context for the GenAI worker
        PromptContext promptContext = buildPromptContext(user, request);

        // Step 3: Call the appropriate GenAI worker (cloud or local) based on user preference
        String aiPreference = request.getAiPreference() != null ? request.getAiPreference() : "cloud";
        GenAIResponse genAIResponse = callGenAIWorker(promptContext, bearerToken, aiPreference);
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

        // Fetch last 7 days' workouts for better context
        List<Map<String, Object>> last7DaysExercises = getLast7DaysExercises(request.getUserId(), request.getDayDate());
        
        // Include textPrompt from request
        String textPrompt = request.getTextPrompt() != null ? request.getTextPrompt() : "";

        return new PromptContext(userProfileMap, user.preferences(), dailyFocusMap, last7DaysExercises, textPrompt);
    }
    
    private List<Map<String, Object>> getLast7DaysExercises(UUID userId, LocalDate currentDate) {
        // Get workouts from 7 days ago up to yesterday (excluding today)
        LocalDate startDate = currentDate.minusDays(7);
        LocalDate endDate = currentDate.minusDays(1);
        
        List<DailyWorkout> recentWorkouts = dailyWorkoutRepository.findByUserIdAndDayDateBetween(
            userId, startDate, endDate);
        
        return recentWorkouts.stream()
            .map(workout -> {
                List<Map<String, Object>> exercises = workout.getScheduledExercises().stream()
                    .map(exercise -> Map.of(
                        "exercise_name", exercise.getExerciseName(),
                        "sport_type", exercise.getApplicableSportTypes().isEmpty() ? 
                            "UNKNOWN" : exercise.getApplicableSportTypes().get(0).toString(),
                        "muscle_groups", exercise.getMuscleGroupsPrimary(),
                        "equipment", exercise.getEquipmentNeeded().stream()
                            .map(Enum::toString)
                            .collect(Collectors.toList()),
                        "difficulty", exercise.getDifficulty(),
                        "sets_reps", exercise.getPrescribedSetsRepsDuration()
                    ))
                    .collect(Collectors.toList());
                
                return Map.of(
                    "date", workout.getDayDate().toString(),
                    "sport_type", workout.getFocusSportTypeForTheDay().toString(),
                    "completion_status", workout.getCompletionStatus() != null ? 
                        workout.getCompletionStatus().toString() : "PENDING",
                    "exercises", exercises
                );
            })
            .collect(Collectors.toList());
    }
    
    private GenAIResponse callGenAIWorker(PromptContext context, String bearerToken, String aiPreference) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", bearerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<PromptContext> entity = new HttpEntity<>(context, headers);
        
        // Choose appropriate RestTemplate based on AI preference
        RestTemplate restTemplate = "local".equalsIgnoreCase(aiPreference) ? 
            genaiLocalRestTemplate : genaiCloudRestTemplate;
        
        String workerType = "local".equalsIgnoreCase(aiPreference) ? "Local AI" : "Cloud AI";
        
        try {
            logger.info("Calling {} worker for workout generation with preference: {}", workerType, aiPreference);
            ResponseEntity<GenAIResponse> response = restTemplate.exchange(
                "/generate", HttpMethod.POST, entity, GenAIResponse.class);
            logger.info("{} worker responded successfully", workerType);
            return response.getBody();
        } catch(Exception e) {
            logger.error("Error calling {} worker: {}", workerType, e.getMessage());
            return null;
        }
    }

    private DailyWorkout persistWorkoutPlan(WorkoutPlanGenerationRequest request, GenAIResponse genAIResponse) {
        GenAIDailyWorkout aiWorkout = genAIResponse.daily_workout();
        
        DailyWorkout dailyWorkout = new DailyWorkout();
        dailyWorkout.setUserId(request.getUserId());
        dailyWorkout.setDayDate(request.getDayDate());
        // Use sport type from AI response (like weekly method) instead of request to properly handle REST
        dailyWorkout.setFocusSportTypeForTheDay(parseSportType(aiWorkout.focus_sport_type_for_the_day()));
        dailyWorkout.setMarkdownContent(aiWorkout.markdown_content());
        
        List<ScheduledExercise> exercises = aiWorkout.scheduled_exercises().stream().map(aiExercise -> {
            ScheduledExercise exercise = new ScheduledExercise();
            exercise.setSequenceOrder(aiExercise.sequence_order());
            exercise.setExerciseName(aiExercise.exercise_name());
            exercise.setDescription(aiExercise.description());
            exercise.setApplicableSportTypes(parseSportTypes(aiExercise.applicable_sport_types()));
            exercise.setMuscleGroupsPrimary(aiExercise.muscle_groups_primary());
            exercise.setMuscleGroupsSecondary(aiExercise.muscle_groups_secondary());
            exercise.setEquipmentNeeded(parseEquipmentItems(aiExercise.equipment_needed()));
            exercise.setDifficulty(aiExercise.difficulty());
            exercise.setPrescribedSetsRepsDuration(aiExercise.prescribed_sets_reps_duration());
            exercise.setVoiceScriptCueText(aiExercise.voice_script_cue_text());
            exercise.setVideoUrl(aiExercise.video_url());
            return exercise;
        }).collect(Collectors.toList());
        
        dailyWorkout.setScheduledExercises(exercises);

        return dailyWorkoutRepository.save(dailyWorkout);
    }

    public Optional<DailyWorkoutResponse> getWorkoutByUserAndDate(UUID userId, java.time.LocalDate date) {
        Optional<DailyWorkout> workout = dailyWorkoutRepository.findByUserIdAndDayDate(userId, date);
        return workout.map(mapper::toDailyWorkoutResponse);
    }

    public List<DailyWorkoutResponse> getWorkoutsByUserAndDateRange(UUID userId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        List<DailyWorkout> workouts = dailyWorkoutRepository.findByUserIdAndDayDateBetween(userId, startDate, endDate);
        return workouts.stream()
                      .map(mapper::toDailyWorkoutResponse)
                      .collect(Collectors.toList());
    }

    @Transactional
    public List<DailyWorkoutResponse> generateWeeklyPlan(WorkoutPlanGenerationRequest request, String bearerToken) {
        // Step 1: Call user-service to get the user's full profile
        UserResponse user = getUserProfile(request.getUserId(), bearerToken);
        if (user == null) {
            throw new IllegalStateException("User not found or unable to fetch profile.");
        }

        // Step 2: Fetch last 7 days of workouts
        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(7);
        List<DailyWorkout> last7DaysWorkouts = dailyWorkoutRepository.findByUserIdAndDayDateBetween(
            request.getUserId(), sevenDaysAgo, today
        );

        // Step 3: Build the weekly prompt context
        WeeklyPromptContext promptContext = buildWeeklyPromptContext(user, request, last7DaysWorkouts);

        // Step 4: Call the appropriate GenAI worker for weekly generation based on user preference
        String aiPreference = request.getAiPreference() != null ? request.getAiPreference() : "cloud";
        GenAIWeeklyResponse genAIResponse = callGenAIWorkerForWeekly(promptContext, bearerToken, aiPreference);
        if (genAIResponse == null || genAIResponse.workouts() == null || genAIResponse.workouts().isEmpty()) {
            throw new IllegalStateException("Failed to generate weekly workout plan from GenAI service.");
        }

        // Step 5: Create and save all 7 workout entities from the GenAI response
        List<DailyWorkout> savedWorkouts = persistWeeklyWorkoutPlan(request, genAIResponse);

        // Step 6: Map the saved entities to response DTOs and return
        return savedWorkouts.stream()
                          .map(mapper::toDailyWorkoutResponse)
                          .collect(Collectors.toList());
    }

    private WeeklyPromptContext buildWeeklyPromptContext(UserResponse user, WorkoutPlanGenerationRequest request, List<DailyWorkout> last7Days) {
        int age = Period.between(user.dateOfBirth(), LocalDate.now()).getYears();
        
        Map<String, Object> userProfileMap = Map.of(
            "user_id", user.id().toString(),
            "date_of_birth", user.dateOfBirth().toString(),
            "height_cm", user.heightCm() != null ? user.heightCm() : 180,
            "weight_kg", user.weightKg() != null ? user.weightKg() : 75,
            "gender", user.gender() != null ? user.gender() : "UNKNOWN"
        );
        
        // Transform last 7 days workouts into the expected format
        List<Map<String, Object>> last7DaysExercises = new ArrayList<>();
        for (DailyWorkout workout : last7Days) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("day_date", workout.getDayDate().toString());
            dayData.put("sport_type", workout.getFocusSportTypeForTheDay().toString());
            
            List<String> exerciseNames = workout.getScheduledExercises().stream()
                .map(ScheduledExercise::getExerciseName)
                .collect(Collectors.toList());
            dayData.put("exercises", exerciseNames);
            
            List<String> muscleGroups = workout.getScheduledExercises().stream()
                .flatMap(ex -> ex.getMuscleGroupsPrimary().stream())
                .distinct()
                .collect(Collectors.toList());
            dayData.put("muscle_groups_worked", muscleGroups);
            
            last7DaysExercises.add(dayData);
        }
        
        String textPrompt = request.getTextPrompt() != null ? request.getTextPrompt() : 
            "Generate a balanced 7-day workout plan with proper progression and recovery";

        return new WeeklyPromptContext(userProfileMap, user.preferences(), textPrompt, last7DaysExercises);
    }

    private GenAIWeeklyResponse callGenAIWorkerForWeekly(WeeklyPromptContext context, String bearerToken, String aiPreference) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", bearerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<WeeklyPromptContext> entity = new HttpEntity<>(context, headers);
        
        // Choose appropriate RestTemplate based on AI preference
        RestTemplate restTemplate = "local".equalsIgnoreCase(aiPreference) ? 
            genaiLocalRestTemplate : genaiCloudRestTemplate;
        
        String workerType = "local".equalsIgnoreCase(aiPreference) ? "Local AI" : "Cloud AI";
        
        try {
            logger.info("Calling {} worker for weekly workout generation with preference: {}", workerType, aiPreference);
            ResponseEntity<GenAIWeeklyResponse> response = restTemplate.exchange(
                "/generate-weekly", HttpMethod.POST, entity, GenAIWeeklyResponse.class);
            logger.info("{} worker responded successfully for weekly plan", workerType);
            return response.getBody();
        } catch(Exception e) {
            logger.error("Error calling {} worker for weekly plan: {}", workerType, e.getMessage());
            return null;
        }
    }

    private List<DailyWorkout> persistWeeklyWorkoutPlan(WorkoutPlanGenerationRequest request, GenAIWeeklyResponse genAIResponse) {
        List<DailyWorkout> savedWorkouts = new ArrayList<>();
        
        for (GenAIDailyWorkout aiWorkout : genAIResponse.workouts()) {
            DailyWorkout dailyWorkout = new DailyWorkout();
            dailyWorkout.setUserId(request.getUserId());
            dailyWorkout.setDayDate(LocalDate.parse(aiWorkout.day_date()));
            dailyWorkout.setFocusSportTypeForTheDay(parseSportType(aiWorkout.focus_sport_type_for_the_day()));
            dailyWorkout.setMarkdownContent(aiWorkout.markdown_content());
            
            List<ScheduledExercise> exercises = aiWorkout.scheduled_exercises().stream().map(aiExercise -> {
                ScheduledExercise exercise = new ScheduledExercise();
                exercise.setSequenceOrder(aiExercise.sequence_order());
                exercise.setExerciseName(aiExercise.exercise_name());
                exercise.setDescription(aiExercise.description());
                exercise.setApplicableSportTypes(parseSportTypes(aiExercise.applicable_sport_types()));
                exercise.setMuscleGroupsPrimary(aiExercise.muscle_groups_primary());
                exercise.setMuscleGroupsSecondary(aiExercise.muscle_groups_secondary());
                exercise.setEquipmentNeeded(parseEquipmentItems(aiExercise.equipment_needed()));
                exercise.setDifficulty(aiExercise.difficulty());
                exercise.setPrescribedSetsRepsDuration(aiExercise.prescribed_sets_reps_duration());
                exercise.setVoiceScriptCueText(aiExercise.voice_script_cue_text());
                exercise.setVideoUrl(aiExercise.video_url());
                return exercise;
            }).collect(Collectors.toList());
            
            dailyWorkout.setScheduledExercises(exercises);
            savedWorkouts.add(dailyWorkoutRepository.save(dailyWorkout));
        }

        return savedWorkouts;
    }
    
    @Transactional
    public Optional<DailyWorkoutResponse> completeWorkout(UUID workoutId) {
        Optional<DailyWorkout> workoutOptional = dailyWorkoutRepository.findById(workoutId);
        
        if (workoutOptional.isPresent()) {
            DailyWorkout workout = workoutOptional.get();
            workout.setCompletionStatus(CompletionStatus.COMPLETED);
            
            // Also mark all exercises in this workout as completed
            workout.getScheduledExercises().forEach(exercise -> {
                if (exercise.getCompletionStatus() != CompletionStatus.COMPLETED) {
                    exercise.setCompletionStatus(CompletionStatus.COMPLETED);
                }
            });
            
            DailyWorkout savedWorkout = dailyWorkoutRepository.save(workout);
            return Optional.of(mapper.toDailyWorkoutResponse(savedWorkout));
        }
        
        return Optional.empty();
    }
    
    @Transactional
    public boolean completeExercise(UUID exerciseId) {
        Optional<ScheduledExercise> exerciseOptional = scheduledExerciseRepository.findById(exerciseId);
        
        if (exerciseOptional.isPresent()) {
            ScheduledExercise exercise = exerciseOptional.get();
            exercise.setCompletionStatus(CompletionStatus.COMPLETED);
            scheduledExerciseRepository.save(exercise);
            
            // Check if all exercises in the workout are completed and update workout status
            DailyWorkout workout = exercise.getDailyWorkout();
            boolean allExercisesCompleted = workout.getScheduledExercises().stream()
                .allMatch(ex -> ex.getCompletionStatus() == CompletionStatus.COMPLETED);
            
            if (allExercisesCompleted && workout.getCompletionStatus() != CompletionStatus.COMPLETED) {
                workout.setCompletionStatus(CompletionStatus.COMPLETED);
                dailyWorkoutRepository.save(workout);
            }
            
            return true;
        }
        
        return false;
    }
}
