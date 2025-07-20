package com.flexfit.userservice.dto;

import com.flexfit.userservice.models.enums.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Schema(description = "User profile information returned by the API")
public class UserResponse {
    
    @Schema(
        description = "Unique user identifier", 
        example = "550e8400-e29b-41d4-a716-446655440000",
        format = "uuid"
    )
    private UUID id;
    
    @Schema(
        description = "User's unique username", 
        example = "john_doe_fitness"
    )
    private String username;
    
    @Schema(
        description = "User's email address", 
        example = "john.doe@example.com",
        format = "email"
    )
    private String email;
    
    @Schema(
        description = "User's date of birth", 
        example = "1990-05-15",
        format = "date"
    )
    private LocalDate dateOfBirth;
    
    @Schema(
        description = "User's height in centimeters", 
        example = "175"
    )
    private Integer heightCm;
    
    @Schema(
        description = "User's weight in kilograms", 
        example = "70.5"
    )
    private Double weightKg;
    
    @Schema(
        description = "User's gender identification", 
        example = "MALE",
        allowableValues = {"MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", "OTHER"}
    )
    private Gender gender;
    
    @Schema(description = "User's fitness preferences and settings")
    private UserPreferencesResponse preferences;
    
    @Schema(
        description = "Account creation timestamp", 
        example = "2025-01-20T10:30:00",
        format = "date-time"
    )
    private LocalDateTime createdAt;
}