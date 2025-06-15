package com.flexfit.userservice.dto;

import com.flexfit.userservice.model.enums.Gender;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class UserResponse {
    private UUID id;
    private String username;
    private String email;
    private LocalDate dateOfBirth;
    private Integer heightCm;
    private Double weightKg;
    private Gender gender;
    private UserPreferencesResponse preferences;
    private LocalDateTime createdAt;
}