package com.flexfit.userservice.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String tokenType;
    private UserResponse user;
    private String message;
} 