package com.flexfit.userservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
@Schema(description = "User login request with email and password")
public class LoginRequest {
    
    @NotEmpty
    @Email
    @Schema(
        description = "User's registered email address", 
        example = "john.doe@example.com",
        required = true,
        format = "email"
    )
    private String email;

    @NotEmpty
    @Schema(
        description = "User's password", 
        example = "securePassword123",
        required = true
    )
    private String password;
} 