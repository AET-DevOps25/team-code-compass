package com.flexfit.workoutplanservice.dto;

import com.flexfit.workoutplanservice.model.enums.CompletionStatus;
import com.flexfit.workoutplanservice.model.enums.SportType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Schema(description = "Daily workout plan with exercises and completion status")
public class DailyWorkoutResponse {
    
    @Schema(
        description = "Unique workout identifier", 
        example = "550e8400-e29b-41d4-a716-446655440000",
        format = "uuid"
    )
    private UUID id;
    
    @Schema(
        description = "User ID for whom this workout was generated", 
        example = "550e8400-e29b-41d4-a716-446655440000",
        format = "uuid"
    )
    private UUID userId;
    
    @Schema(
        description = "Date for which this workout is scheduled", 
        example = "2025-01-20",
        format = "date"
    )
    private LocalDate dayDate;
    
    @Schema(
        description = "Primary focus sport type for this workout", 
        example = "STRENGTH",
        allowableValues = {"STRENGTH", "HIIT", "YOGA_MOBILITY", "RUNNING_INTERVALS"}
    )
    private SportType focusSportTypeForTheDay;
    
    @Schema(
        description = "Current completion status of the workout", 
        example = "PENDING",
        allowableValues = {"PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"}
    )
    private CompletionStatus completionStatus;
    
    @Schema(
        description = "Overall RPE (Rate of Perceived Exertion) feedback for the workout (1-10)", 
        example = "7",
        minimum = "1",
        maximum = "10"
    )
    private Integer rpeOverallFeedback;
    
    @Schema(
        description = "User's notes or comments about the workout completion", 
        example = "Great workout, felt strong today!"
    )
    private String completionNotes;
    
    @Schema(
        description = "Markdown-formatted content describing the workout", 
        example = "# Strength Training Session\n\n## Warm-up\n5 minutes light cardio\n\n## Main Workout\n..."
    )
    private String markdownContent;
    
    @Schema(description = "List of exercises scheduled for this workout")
    private List<ScheduledExerciseResponse> scheduledExercises;
}