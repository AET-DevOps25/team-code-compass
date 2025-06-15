package com.flexfit.workoutplanservice.dto.gains;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// These records map directly to the JSON response from the genai-workout-worker
@JsonIgnoreProperties(ignoreUnknown = true)
public record GenAIResponse(GenAIDailyWorkout daily_workout) {}