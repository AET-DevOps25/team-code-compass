package com.flexfit.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Configuration
public class GatewayConfig {

    @RestController
    public static class GatewayInfoController {

        @GetMapping("/")
        public Map<String, Object> getGatewayInfo() {
            return Map.of(
                "service", "FlexFit API Gateway",
                "version", "v1.0.0",
                "status", "running",
                "description", "Single entry point for FlexFit microservices",
                "routes", Map.of(
                    "users", "/api/users/** → user-service",
                    "workout-plans", "/api/workout-plans/** → workout-plan-service",
                    "user-docs", "/docs/users/** → user-service swagger",
                    "workout-docs", "/docs/workout-plans/** → workout-plan-service swagger"
                ),
                "endpoints", Map.of(
                    "health", "/actuator/health",
                    "routes", "/actuator/gateway/routes",
                    "user-swagger", "/docs/users/swagger-ui/index.html",
                    "workout-swagger", "/docs/workout-plans/swagger-ui/index.html"
                )
            );
        }

        @GetMapping("/routes")
        public Map<String, String> getRoutes() {
            return Map.of(
                "Users API", "/api/users/**",
                "Workout Plans API", "/api/workout-plans/**",
                "User Service Docs", "/docs/users/swagger-ui/index.html",
                "Workout Service Docs", "/docs/workout-plans/swagger-ui/index.html",
                "Gateway Health", "/actuator/health",
                "Gateway Routes Info", "/actuator/gateway/routes"
            );
        }
    }
} 