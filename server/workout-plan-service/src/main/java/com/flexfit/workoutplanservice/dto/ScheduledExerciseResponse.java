package com.flexfit.workoutplanservice.dto;

import com.flexfit.workoutplanservice.model.enums.CompletionStatus;
import com.flexfit.workoutplanservice.model.enums.EquipmentItem;
import com.flexfit.workoutplanservice.model.enums.SportType;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ScheduledExerciseResponse {
    private UUID id;
    private Integer sequenceOrder;
    private String exerciseName;
    private String description;
    private List<SportType> applicableSportTypes;
    private List<String> muscleGroupsPrimary;
    private List<String> muscleGroupsSecondary;
    private List<EquipmentItem> equipmentNeeded;
    private String difficulty;
    private String prescribedSetsRepsDuration;
    private String voiceScriptCueText;
    private String videoUrl;
    private Integer rpeFeedback;
    private CompletionStatus completionStatus;
}