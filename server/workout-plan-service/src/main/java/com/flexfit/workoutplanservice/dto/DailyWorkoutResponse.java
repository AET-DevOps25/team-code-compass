package com.flexfit.workoutplanservice.dto;

import com.flexfit.workoutplanservice.model.enums.CompletionStatus;
import com.flexfit.workoutplanservice.model.enums.SportType;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class DailyWorkoutResponse {
    private UUID id;
    private UUID userId;
    private LocalDate dayDate;
    private SportType focusSportTypeForTheDay;
    private CompletionStatus completionStatus;
    private Integer rpeOverallFeedback;
    private String completionNotes;
    private List<ScheduledExerciseResponse> scheduledExercises;
}