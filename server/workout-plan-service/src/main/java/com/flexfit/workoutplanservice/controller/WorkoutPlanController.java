package com.flexfit.workoutplanservice.controller;

import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.dto.WorkoutPlanGenerationRequest;
import com.flexfit.workoutplanservice.service.WorkoutPlanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Workout Plan Management", description = "APIs for generating and managing AI-powered workout plans")
public class WorkoutPlanController {

    private final WorkoutPlanService workoutPlanService;

    @PostMapping("/generate")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Generate daily workout plan",
        description = "Generate a personalized daily workout plan using AI based on user preferences, target sport type, and duration. Supports both cloud AI (Claude/OpenAI) and local AI (GPT4All/Ollama) through the aiPreference parameter."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Workout plan generated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = DailyWorkoutResponse.class),
                examples = @ExampleObject(
                    name = "Generated Workout Plan",
                    value = """
                        {
                          "id": "550e8400-e29b-41d4-a716-446655440000",
                          "userId": "550e8400-e29b-41d4-a716-446655440000",
                          "dayDate": "2025-01-20",
                          "focusSportTypeForTheDay": "STRENGTH",
                          "completionStatus": "PENDING",
                          "markdownContent": "# Strength Training Session\\n\\n## Warm-up\\n5 minutes light cardio\\n\\n## Main Workout\\n...",
                          "scheduledExercises": [
                            {
                              "sequenceOrder": 1,
                              "exerciseName": "Push-ups",
                              "description": "Classic upper body strength exercise",
                              "muscleGroupsPrimary": ["Chest", "Triceps"],
                              "equipmentNeeded": ["NO_EQUIPMENT"],
                              "prescribedSetsRepsDuration": "3 sets x 12 reps"
                            }
                          ]
                        }
                        """
                )
            )
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing JWT token"),
        @ApiResponse(responseCode = "400", description = "Bad request - validation error or invalid parameters"),
        @ApiResponse(responseCode = "500", description = "Internal server error - GenAI service unavailable or user profile not found")
    })
    public ResponseEntity<DailyWorkoutResponse> generatePlan(
            @Valid 
            @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Workout generation request parameters",
                required = true,
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = WorkoutPlanGenerationRequest.class),
                    examples = @ExampleObject(
                        name = "Strength Training Request",
                        value = """
                            {
                              "userId": "550e8400-e29b-41d4-a716-446655440000",
                              "dayDate": "2025-01-20",
                              "focusSportType": "STRENGTH",
                              "targetDurationMinutes": 45,
                              "textPrompt": "Focus on compound movements, I have access to dumbbells",
                              "aiPreference": "cloud"
                            }
                            """
                    )
                )
            )
            WorkoutPlanGenerationRequest request,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {

        DailyWorkoutResponse response = workoutPlanService.generateWorkoutPlan(request, bearerToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/date/{date}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Get workout by user and date",
        description = "Retrieve a specific workout plan for a user on a given date"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Workout found and returned",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = DailyWorkoutResponse.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing JWT token"),
        @ApiResponse(responseCode = "404", description = "Workout not found for the specified user and date")
    })
    public ResponseEntity<DailyWorkoutResponse> getWorkoutByUserAndDate(
            @Parameter(
                description = "User ID",
                example = "550e8400-e29b-41d4-a716-446655440000",
                required = true
            )
            @PathVariable UUID userId,
            @Parameter(
                description = "Workout date in YYYY-MM-DD format",
                example = "2025-01-20",
                required = true
            )
            @PathVariable String date,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {
        
        LocalDate workoutDate = LocalDate.parse(date);
        Optional<DailyWorkoutResponse> workout = workoutPlanService.getWorkoutByUserAndDate(userId, workoutDate);
        
        return workout.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}/range")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Get workouts by date range",
        description = "Retrieve all workout plans for a user within a specified date range"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Workouts retrieved successfully (may be empty list)",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "array", implementation = DailyWorkoutResponse.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing JWT token"),
        @ApiResponse(responseCode = "400", description = "Bad request - invalid date format")
    })
    public ResponseEntity<List<DailyWorkoutResponse>> getWorkoutsByUserAndDateRange(
            @Parameter(
                description = "User ID",
                example = "550e8400-e29b-41d4-a716-446655440000",
                required = true
            )
            @PathVariable UUID userId,
            @Parameter(
                description = "Start date in YYYY-MM-DD format",
                example = "2025-01-15",
                required = true
            )
            @RequestParam String startDate,
            @Parameter(
                description = "End date in YYYY-MM-DD format",
                example = "2025-01-21",
                required = true
            )
            @RequestParam String endDate,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {
        
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        List<DailyWorkoutResponse> workouts = workoutPlanService.getWorkoutsByUserAndDateRange(userId, start, end);
        
        return ResponseEntity.ok(workouts);
    }

    @PostMapping("/generate-weekly-plan")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Generate weekly workout plan",
        description = "Generate a comprehensive 7-day workout plan with balanced training across different sport types and proper recovery. Uses AI to ensure progression and variety."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Weekly workout plan generated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(type = "array", implementation = DailyWorkoutResponse.class),
                examples = @ExampleObject(
                    name = "Weekly Plan",
                    value = """
                        [
                          {
                            "dayDate": "2025-01-20",
                            "focusSportTypeForTheDay": "STRENGTH",
                            "scheduledExercises": [...]
                          },
                          {
                            "dayDate": "2025-01-21",
                            "focusSportTypeForTheDay": "HIIT",
                            "scheduledExercises": [...]
                          }
                        ]
                        """
                )
            )
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing JWT token"),
        @ApiResponse(responseCode = "400", description = "Bad request - validation error"),
        @ApiResponse(responseCode = "500", description = "Internal server error - GenAI service unavailable")
    })
    public ResponseEntity<List<DailyWorkoutResponse>> generateWeeklyPlan(
            @Valid 
            @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                description = "Weekly workout generation request (uses dayDate as starting point for the week)",
                required = true,
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = WorkoutPlanGenerationRequest.class),
                    examples = @ExampleObject(
                        name = "Weekly Plan Request",
                        value = """
                            {
                              "userId": "550e8400-e29b-41d4-a716-446655440000",
                              "dayDate": "2025-01-20",
                              "focusSportType": "STRENGTH",
                              "targetDurationMinutes": 45,
                              "textPrompt": "Create a balanced weekly plan with strength, cardio, and recovery days",
                              "aiPreference": "cloud"
                            }
                            """
                    )
                )
            )
            WorkoutPlanGenerationRequest request,
            @Parameter(hidden = true) @RequestHeader("Authorization") String bearerToken) {
        
        List<DailyWorkoutResponse> weeklyPlan = workoutPlanService.generateWeeklyPlan(request, bearerToken);
        return ResponseEntity.ok(weeklyPlan);
    }

    @GetMapping("/health")
    @Operation(
        summary = "Workout service health check",
        description = "Check if the workout plan service is running and operational"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Service is healthy",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Health Status",
                    value = """
                        {
                          "service": "workout-plan-service",
                          "status": "UP",
                          "message": "Workout Plan service is running successfully!"
                        }
                        """
                )
            )
        )
    })
    public Map<String, String> health() {
        return Map.of(
            "service", "workout-plan-service",
            "status", "UP",
            "message", "Workout Plan service is running successfully!"
        );
    }

    @GetMapping("/info")
    @Operation(
        summary = "Service information",
        description = "Get basic information about the workout plan service"
    )
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