package com.flexfit.workoutplanservice.dto;

import com.flexfit.workoutplanservice.model.enums.SportType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class WorkoutPlanGenerationRequest {

    @NotNull
    private UUID userId;

    @NotNull
    private LocalDate dayDate;

    @NotNull
    private SportType focusSportType;

    @NotNull
    private Integer targetDurationMinutes;
}

