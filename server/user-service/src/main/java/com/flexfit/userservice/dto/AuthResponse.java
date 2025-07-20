package com.flexfit.userservice.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.Builder;

@Data
@Builder
@Schema(description = "Authentication response containing JWT token and user information")
public class AuthResponse {
    
    @Schema(
        description = "JWT access token for API authentication", 
        example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        required = true
    )
    private String token;
    
    @Schema(
        description = "Token type for authorization header", 
        example = "Bearer",
        required = true
    )
    private String tokenType;
    
    @Schema(
        description = "User profile information",
        required = true
    )
    private UserResponse user;
    
    @Schema(
        description = "Success message", 
        example = "Login successful"
    )
    private String message;
} 