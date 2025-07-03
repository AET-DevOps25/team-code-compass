package com.flexfit.userservice.models;

import com.flexfit.userservice.models.enums.EquipmentItem;
import com.flexfit.userservice.models.enums.ExperienceLevel;
import com.flexfit.userservice.models.enums.FitnessGoal;
import com.flexfit.userservice.models.enums.IntensityPreference;
import com.flexfit.userservice.models.enums.SportType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences {

    @Id
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // This makes the 'id' field also the foreign key
    @JoinColumn(name = "id")
    private User user;

    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @ElementCollection(targetClass = FitnessGoal.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_fitness_goals", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "fitness_goal")
    private List<FitnessGoal> fitnessGoals;

    @ElementCollection(targetClass = SportType.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_preferred_sports", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "sport_type")
    private List<SportType> preferredSportTypes;

    @ElementCollection(targetClass = EquipmentItem.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_available_equipment", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "equipment_item")
    private List<EquipmentItem> availableEquipment;

    private String workoutDurationRange;

    @Enumerated(EnumType.STRING)
    private IntensityPreference intensityPreference;

    @Column(columnDefinition = "TEXT")
    private String healthNotes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_disliked_exercises", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "exercise_name")
    private List<String> dislikedExercises;
}