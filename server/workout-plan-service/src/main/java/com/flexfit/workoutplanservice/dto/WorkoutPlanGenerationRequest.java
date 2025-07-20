package com.flexfit.workoutplanservice.dto;

import com.flexfit.workoutplanservice.model.enums.SportType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Max;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Schema(description = "Request for generating a personalized workout plan")
public class WorkoutPlanGenerationRequest {

    @NotNull
    @Schema(
        description = "User ID for whom the workout is being generated", 
        example = "550e8400-e29b-41d4-a716-446655440000",
        required = true,
        format = "uuid"
    )
    private UUID userId;

    @NotNull
    @Schema(
        description = "Target date for the workout", 
        example = "2025-01-20",
        required = true,
        format = "date"
    )
    private LocalDate dayDate;

    @NotNull
    @Schema(
        description = "Primary focus sport type for the workout", 
        example = "STRENGTH",
        required = true,
        allowableValues = {"STRENGTH", "HIIT", "YOGA_MOBILITY", "RUNNING_INTERVALS"}
    )
    private SportType focusSportType;

    @NotNull
    @Positive
    @Max(value = 240, message = "Workout duration cannot exceed 240 minutes")
    @Schema(
        description = "Target duration for the workout in minutes", 
        example = "45",
        required = true,
        minimum = "1",
        maximum = "240"
    )
    private Integer targetDurationMinutes;
    
    @Schema(
        description = "Additional text prompt or specific requests for the workout", 
        example = "Focus on compound movements, I have a sore shoulder",
        required = false,
        maxLength = 500
    )
    private String textPrompt;
    
    @Schema(
        description = "AI preference for workout generation", 
        example = "cloud",
        required = false,
        allowableValues = {"cloud", "local"},
        defaultValue = "cloud"
    )
    private String aiPreference = "cloud";
}

