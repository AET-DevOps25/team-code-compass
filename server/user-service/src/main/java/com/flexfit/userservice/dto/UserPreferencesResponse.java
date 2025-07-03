package com.flexfit.userservice.dto;

import com.flexfit.userservice.models.enums.*;
import lombok.Data;
import java.util.List;

@Data
public class UserPreferencesResponse {
    private ExperienceLevel experienceLevel;
    private List<FitnessGoal> fitnessGoals;
    private List<SportType> preferredSportTypes;
    private List<EquipmentItem> availableEquipment;
    private String workoutDurationRange;
    private IntensityPreference intensityPreference;
    private String healthNotes;
    private List<String> dislikedExercises;
}