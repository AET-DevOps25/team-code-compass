package com.flexfit.workoutplanservice.dto.gains;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GenAIDailyWorkout(
    String day_date, 
    String focus_sport_type_for_the_day, 
    List<GenAIExercise> scheduled_exercises
) {} 