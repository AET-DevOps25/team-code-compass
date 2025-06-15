package com.flexfit.workoutplanservice.repository;

import com.flexfit.workoutplanservice.model.ScheduledExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ScheduledExerciseRepository extends JpaRepository<ScheduledExercise, UUID> {
    // Basic CRUD methods are inherited from JpaRepository.
    // Custom query methods can be added here if needed later.
}
