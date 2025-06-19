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
}