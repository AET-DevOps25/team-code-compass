package com.flexfit.userservice.dto;

import com.flexfit.userservice.models.enums.Gender;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
@Schema(description = "User registration request containing all required and optional user information")
public class UserRegistrationRequest {
    
    @NotEmpty
    @Schema(
        description = "Unique username for the user account", 
        example = "john_doe_fitness",
        required = true,
        minLength = 1
    )
    private String username;

    @NotEmpty
    @Email
    @Schema(
        description = "User's email address - must be unique and valid", 
        example = "john.doe@example.com",
        required = true,
        format = "email"
    )
    private String email;

    @NotEmpty
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Schema(
        description = "User's password - minimum 8 characters", 
        example = "securePassword123",
        required = true,
        minLength = 8
    )
    private String password;

    @NotNull
    @Schema(
        description = "User's date of birth", 
        example = "1990-05-15",
        required = true,
        format = "date"
    )
    private LocalDate dateOfBirth;

    @NotNull
    @Schema(
        description = "User's gender identification", 
        example = "MALE",
        required = true,
        allowableValues = {"MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY", "OTHER"}
    )
    private Gender gender;
    
    @Schema(
        description = "User's height in centimeters", 
        example = "175",
        required = false
    )
    private Integer heightCm;
    
    @Schema(
        description = "User's weight in kilograms", 
        example = "70.5",
        required = false
    )
    private Double weightKg;
}