package com.flexfit.workoutplanservice.repository;

import com.flexfit.workoutplanservice.model.DailyWorkout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyWorkoutRepository extends JpaRepository<DailyWorkout, UUID> {

    // Finds a workout for a specific user on a specific date.
    Optional<DailyWorkout> findByUserIdAndDayDate(UUID userId, LocalDate dayDate);

    // Finds all workouts for a user within a given date range.
    List<DailyWorkout> findByUserIdAndDayDateBetween(UUID userId, LocalDate startDate, LocalDate endDate);
}