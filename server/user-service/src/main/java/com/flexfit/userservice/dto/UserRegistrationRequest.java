package com.flexfit.userservice.dto;

import com.flexfit.userservice.models.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UserRegistrationRequest {
    @NotEmpty
    private String username;

    @NotEmpty
    @Email
    private String email;

    @NotEmpty
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotNull
    private LocalDate dateOfBirth;

    @NotNull
    private Gender gender;
    
    private Integer heightCm;
    private Double weightKg;
}