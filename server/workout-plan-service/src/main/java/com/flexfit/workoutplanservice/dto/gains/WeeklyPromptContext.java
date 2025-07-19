package com.flexfit.workoutplanservice.dto.gains;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.flexfit.workoutplanservice.dto.user.UserPreferencesResponse;
import java.util.List;
import java.util.Map;

public record WeeklyPromptContext(
    @JsonProperty("user_profile") Map<String, Object> userProfile,
    @JsonProperty("user_preferences") UserPreferencesResponse userPreferences,
    @JsonProperty("text_prompt") String textPrompt,
    @JsonProperty("last_7_days_exercises") List<Map<String, Object>> last7DaysExercises
) {}