package com.flexfit.workoutplanservice.dto.gains;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.flexfit.workoutplanservice.dto.user.UserPreferencesResponse;
import java.util.List;
import java.util.Map;

// This record structures the full context for the GenAI prompt
public record PromptContext(
    @JsonProperty("user_profile") Map<String, Object> userProfile,
    @JsonProperty("user_preferences") UserPreferencesResponse userPreferences,
    @JsonProperty("daily_focus") Map<String, Object> dailyFocus,
    @JsonProperty("last_7_days_exercises") List<Map<String, Object>> last7DaysExercises,
    @JsonProperty("text_prompt") String textPrompt
) {} 