package com.flexfit.workoutplanservice.dto.gains;

import com.flexfit.workoutplanservice.dto.user.UserPreferencesResponse;
import java.util.Map;

// This record structures the full context for the GenAI prompt
public record PromptContext(
    Map<String, Object> userProfile,
    UserPreferencesResponse userPreferences,
    Map<String, Object> dailyFocus
) {} 