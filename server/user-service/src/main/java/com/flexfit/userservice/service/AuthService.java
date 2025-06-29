package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.AuthResponse;
import com.flexfit.userservice.dto.LoginRequest;

public interface AuthService {
    AuthResponse login(LoginRequest loginRequest);
    AuthResponse registerAndLogin(String email, String password);
} 