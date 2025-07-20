package com.flexfit.workoutplanservice.controller;

import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.dto.WorkoutPlanGenerationRequest;
import com.flexfit.workoutplanservice.service.WorkoutPlanService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/plans")
@RequiredArgsConstructor
public class WorkoutPlanController {

    private final WorkoutPlanService workoutPlanService;

    @PostMapping("/generate")
    @SecurityRequirement(name = "bearerAuth") // Indicates this endpoint is secured
    public ResponseEntity<DailyWorkoutResponse> generatePlan(
            @Valid @RequestBody WorkoutPlanGenerationRequest request,
            @RequestHeader("Authorization") String bearerToken) {

        DailyWorkoutResponse response = workoutPlanService.generateWorkoutPlan(request, bearerToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/date/{date}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<DailyWorkoutResponse> getWorkoutByUserAndDate(
            @PathVariable UUID userId,
            @PathVariable String date,
            @RequestHeader("Authorization") String bearerToken) {
        
        LocalDate workoutDate = LocalDate.parse(date);
        Optional<DailyWorkoutResponse> workout = workoutPlanService.getWorkoutByUserAndDate(userId, workoutDate);
        
        return workout.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}/range")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<DailyWorkoutResponse>> getWorkoutsByUserAndDateRange(
            @PathVariable UUID userId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestHeader("Authorization") String bearerToken) {
        
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        List<DailyWorkoutResponse> workouts = workoutPlanService.getWorkoutsByUserAndDateRange(userId, start, end);
        
        return ResponseEntity.ok(workouts);
    }

    @PostMapping("/generate-weekly-plan")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<List<DailyWorkoutResponse>> generateWeeklyPlan(
            @Valid @RequestBody WorkoutPlanGenerationRequest request,
            @RequestHeader("Authorization") String bearerToken) {
        
        List<DailyWorkoutResponse> weeklyPlan = workoutPlanService.generateWeeklyPlan(request, bearerToken);
        return ResponseEntity.ok(weeklyPlan);
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "service", "workout-plan-service",
            "status", "UP",
            "message", "Workout Plan service is running successfully!"
        );
    }

    @GetMapping("/info")
    public Map<String, String> info() {
        return Map.of(
            "service", "workout-plan-service",
            "version", "1.0.0",
            "description", "FlexFit Workout Plan Management Service"
        );
    }

    @PutMapping("/workout/{workoutId}/complete")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<DailyWorkoutResponse> completeWorkout(
            @PathVariable UUID workoutId,
            @RequestHeader("Authorization") String bearerToken) {
        
        Optional<DailyWorkoutResponse> completedWorkout = workoutPlanService.completeWorkout(workoutId);
        
        return completedWorkout.map(ResponseEntity::ok)
                              .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/exercise/{exerciseId}/complete")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<Map<String, String>> completeExercise(
            @PathVariable UUID exerciseId,
            @RequestHeader("Authorization") String bearerToken) {
        
        boolean success = workoutPlanService.completeExercise(exerciseId);
        
        if (success) {
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Exercise marked as completed"
            ));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}