package com.flexfit.userservice.controller;

import com.flexfit.userservice.dto.UserRegistrationRequest;
import com.flexfit.userservice.dto.UserResponse;
import com.flexfit.userservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "APIs for user registration, profile management, and user information")
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    @Operation(
        summary = "Register a new user",
        description = "Create a new user account with username, email, password, and personal information. Username and email must be unique."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "User successfully registered",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class),
                examples = @ExampleObject(
                    name = "Successful Registration",
                    value = """
                        {
                          "id": "550e8400-e29b-41d4-a716-446655440000",
                          "username": "john_doe_fitness",
                          "email": "john.doe@example.com",
                          "dateOfBirth": "1990-05-15",
                          "heightCm": 175,
                          "weightKg": 70.5,
                          "gender": "MALE",
                          "preferences": {},
                          "createdAt": "2025-01-20T10:30:00"
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "409", 
            description = "Username or email already exists",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Conflict Error",
                    value = """
                        {
                          "error": "Username already exists"
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "400", 
            description = "Validation error",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Validation Error",
                    value = """
                        {
                          "error": "Validation Failed",
                          "details": {
                            "email": "must be a well-formed email address",
                            "password": "Password must be at least 8 characters long"
                          }
                        }
                        """
                )
            )
        )
    })
    public ResponseEntity<UserResponse> registerUser(
        @Valid 
        @RequestBody
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User registration information",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserRegistrationRequest.class),
                examples = @ExampleObject(
                    name = "Complete Registration",
                    value = """
                        {
                          "username": "john_doe_fitness",
                          "email": "john.doe@example.com",
                          "password": "securePassword123",
                          "dateOfBirth": "1990-05-15",
                          "gender": "MALE",
                          "heightCm": 175,
                          "weightKg": 70.5
                        }
                        """
                )
            )
        )
        UserRegistrationRequest registrationRequest) {
        UserResponse newUser = userService.registerUser(registrationRequest);
        return new ResponseEntity<>(newUser, HttpStatus.CREATED);
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Get current user profile",
        description = "Retrieve the profile information of the currently authenticated user"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User profile retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing JWT token"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getSubject(); // Email is stored as subject in JWT
        return userService.getUserByEmail(userEmail)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
        summary = "Get user by ID",
        description = "Retrieve user profile information by user ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "User found and returned",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class)
            )
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized - invalid or missing JWT token"),
        @ApiResponse(responseCode = "404", description = "User not found")
    })
    public ResponseEntity<UserResponse> getUserById(
        @Parameter(
            description = "User ID (UUID)",
            example = "550e8400-e29b-41d4-a716-446655440000",
            required = true
        )
        @PathVariable UUID id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "service", "user-service",
            "status", "UP",
            "message", "User service is running successfully!"
        );
    }

    @GetMapping("/info")
    public Map<String, String> info() {
        return Map.of(
            "service", "user-service",
            "version", "1.0.0",
            "description", "FlexFit User Management Service"
        );
    }
}
