package com.flexfit.workoutplanservice.model;

import com.flexfit.workoutplanservice.model.enums.CompletionStatus;
import com.flexfit.workoutplanservice.model.enums.SportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "daily_workouts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyWorkout {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId; // Links to the User in user-service, but not a hard FK

    @Column(nullable = false)
    private LocalDate dayDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SportType focusSportTypeForTheDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompletionStatus completionStatus = CompletionStatus.PENDING;

    private Integer rpeOverallFeedback; // Overall RPE for the daily workout
    
    @Column(columnDefinition = "TEXT")
    private String completionNotes;
    
    // Generated markdown content from GenAI for display on frontend
    @Column(columnDefinition = "TEXT")
    private String markdownContent;
    
    @OneToMany(mappedBy = "dailyWorkout", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @OrderBy("sequenceOrder ASC") // Ensures exercises are always ordered correctly
    private List<ScheduledExercise> scheduledExercises;

    // Helper method to correctly link exercises to this workout
    public void setScheduledExercises(List<ScheduledExercise> scheduledExercises) {
        this.scheduledExercises = scheduledExercises;
        if (scheduledExercises != null) {
            for (ScheduledExercise exercise : scheduledExercises) {
                exercise.setDailyWorkout(this);
            }
        }
    }
}