package com.flexfit.userservice.service;

import com.flexfit.userservice.dto.UserRegistrationRequest;
import com.flexfit.userservice.dto.UserResponse;

import java.util.Optional;
import java.util.UUID;

public interface UserService {
    UserResponse registerUser(UserRegistrationRequest registrationRequest);
    Optional<UserResponse> getUserByEmail(String email);
    Optional<UserResponse> getUserById(UUID id);
}