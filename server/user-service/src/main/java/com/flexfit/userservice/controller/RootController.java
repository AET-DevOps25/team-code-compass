package com.flexfit.userservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/")
public class RootController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> getApiInfo() {
        Map<String, Object> apiInfo = Map.of(
            "service", "FlexFit User Service",
            "version", "v1.0.0",
            "status", "running",
            "endpoints", Map.of(
                "api", "/api/v1/users",
                "health", "/actuator/health",
                "swagger", "/swagger-ui/index.html",
                "api-docs", "/v3/api-docs"
            ),
            "description", "User management service for the FlexFit application"
        );
        return ResponseEntity.ok(apiInfo);
    }

    @GetMapping("/api")
    public ResponseEntity<Map<String, Object>> getApiEndpoints() {
        Map<String, Object> endpoints = Map.of(
            "users", Map.of(
                "register", "POST /api/v1/users/register",
                "profile", "GET /api/v1/users/me",
                "byId", "GET /api/v1/users/{id}"
            ),
            "health", "GET /actuator/health",
            "documentation", "GET /swagger-ui/index.html"
        );
        return ResponseEntity.ok(endpoints);
    }
} 