package com.flexfit.workoutplanservice.dto.gains;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GenAIWeeklyResponse(List<GenAIDailyWorkout> workouts) {}