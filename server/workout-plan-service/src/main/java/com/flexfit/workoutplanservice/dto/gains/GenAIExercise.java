package com.flexfit.workoutplanservice.dto.gains;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GenAIExercise(
    int sequence_order,
    String exercise_name,
    String description,
    List<String> applicable_sport_types,
    List<String> muscle_groups_primary,
    List<String> muscle_groups_secondary,
    List<String> equipment_needed,
    String difficulty,
    String prescribed_sets_reps_duration,
    String voice_script_cue_text,
    String video_url
) {} 