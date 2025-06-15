package com.flexfit.workoutplanservice.service;

import com.flexfit.workoutplanservice.dto.DailyWorkoutResponse;
import com.flexfit.workoutplanservice.dto.ScheduledExerciseResponse;
import com.flexfit.workoutplanservice.model.DailyWorkout;
import com.flexfit.workoutplanservice.model.ScheduledExercise;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class WorkoutPlanMapper {

    public DailyWorkoutResponse toDailyWorkoutResponse(DailyWorkout dailyWorkout) {
        DailyWorkoutResponse dto = new DailyWorkoutResponse();
        dto.setId(dailyWorkout.getId());
        dto.setUserId(dailyWorkout.getUserId());
        dto.setDayDate(dailyWorkout.getDayDate());
        dto.setFocusSportTypeForTheDay(dailyWorkout.getFocusSportTypeForTheDay());
        dto.setCompletionStatus(dailyWorkout.getCompletionStatus());
        dto.setRpeOverallFeedback(dailyWorkout.getRpeOverallFeedback());
        dto.setCompletionNotes(dailyWorkout.getCompletionNotes());
        dto.setScheduledExercises(dailyWorkout.getScheduledExercises().stream()
                .map(this::toScheduledExerciseResponse)
                .collect(Collectors.toList()));
        return dto;
    }

    public ScheduledExerciseResponse toScheduledExerciseResponse(ScheduledExercise exercise) {
        ScheduledExerciseResponse dto = new ScheduledExerciseResponse();
        dto.setId(exercise.getId());
        dto.setSequenceOrder(exercise.getSequenceOrder());
        dto.setExerciseName(exercise.getExerciseName());
        dto.setDescription(exercise.getDescription());
        dto.setApplicableSportTypes(exercise.getApplicableSportTypes());
        dto.setMuscleGroupsPrimary(exercise.getMuscleGroupsPrimary());
        dto.setMuscleGroupsSecondary(exercise.getMuscleGroupsSecondary());
        dto.setEquipmentNeeded(exercise.getEquipmentNeeded());
        dto.setDifficulty(exercise.getDifficulty());
        dto.setPrescribedSetsRepsDuration(exercise.getPrescribedSetsRepsDuration());
        dto.setVoiceScriptCueText(exercise.getVoiceScriptCueText());
        dto.setVideoUrl(exercise.getVideoUrl());
        dto.setRpeFeedback(exercise.getRpeFeedback());
        dto.setCompletionStatus(exercise.getCompletionStatus());
        return dto;
    }
}