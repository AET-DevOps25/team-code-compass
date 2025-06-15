package com.flexfit.workoutplanservice.dto.user;

import java.time.LocalDate;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

// This DTO represents the response we expect from the user-service's /api/v1/users/{id} endpoint
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserResponse(
    UUID id,
    String username,
    String email,
    LocalDate dateOfBirth,
    Integer heightCm,
    Double weightKg,
    String gender,
    UserPreferencesResponse preferences
) {}