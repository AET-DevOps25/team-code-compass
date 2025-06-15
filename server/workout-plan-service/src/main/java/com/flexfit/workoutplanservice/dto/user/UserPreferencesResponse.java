package com.flexfit.workoutplanservice.dto.user;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserPreferencesResponse(
    String experienceLevel,
    List<String> fitnessGoals,
    List<String> preferredSportTypes,
    List<String> availableEquipment,
    String workoutDurationRange,
    String intensityPreference,
    String healthNotes,
    List<String> dislikedExercises
) {}