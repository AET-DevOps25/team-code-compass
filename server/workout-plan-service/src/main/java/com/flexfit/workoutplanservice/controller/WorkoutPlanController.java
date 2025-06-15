package com.flexfit.workoutplanservice.controller;

import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.dto.WorkoutPlanGenerationRequest;
import com.flexfit.workoutplanservice.service.WorkoutPlanService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}