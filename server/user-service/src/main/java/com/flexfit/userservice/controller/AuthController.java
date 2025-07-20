package com.flexfit.userservice.controller;

import com.flexfit.userservice.dto.AuthResponse;
import com.flexfit.userservice.dto.LoginRequest;
import com.flexfit.userservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "APIs for user authentication and JWT token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(
        summary = "User login",
        description = "Authenticate user with email and password, returns JWT token for API access"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Login successful",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = AuthResponse.class),
                examples = @ExampleObject(
                    name = "Successful Login",
                    value = """
                        {
                          "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huLmRvZUBleGFtcGxlLmNvbSIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxNjQxMDgxNjAwfQ.signature",
                          "tokenType": "Bearer",
                          "user": {
                            "id": "550e8400-e29b-41d4-a716-446655440000",
                            "username": "john_doe_fitness",
                            "email": "john.doe@example.com",
                            "dateOfBirth": "1990-05-15",
                            "heightCm": 175,
                            "weightKg": 70.5,
                            "gender": "MALE",
                            "preferences": {},
                            "createdAt": "2025-01-20T10:30:00"
                          },
                          "message": "Login successful"
                        }
                        """
                )
            )
        ),
        @ApiResponse(
            responseCode = "401", 
            description = "Invalid credentials",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Authentication Error",
                    value = """
                        {
                          "error": "Invalid email or password"
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
                            "password": "must not be empty"
                          }
                        }
                        """
                )
            )
        )
    })
    public ResponseEntity<AuthResponse> login(
        @Valid 
        @RequestBody
        @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "User login credentials",
            required = true,
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = LoginRequest.class),
                examples = @ExampleObject(
                    name = "Login Credentials",
                    value = """
                        {
                          "email": "john.doe@example.com",
                          "password": "securePassword123"
                        }
                        """
                )
            )
        )
        LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    @Operation(
        summary = "Authentication service health check",
        description = "Check if the authentication service is running and operational"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Service is healthy",
            content = @Content(
                mediaType = "text/plain",
                examples = @ExampleObject(
                    name = "Health Check",
                    value = "Auth service is running"
                )
            )
        )
    })
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is running");
    }
} 