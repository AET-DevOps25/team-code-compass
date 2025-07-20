package com.flexfit.userservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FlexFit User Service API")
                        .description("""
                            User management and authentication service for the FlexFit fitness application.
                            
                            ## Features
                            - **User Registration**: Create new user accounts with validation
                            - **Authentication**: JWT-based login system
                            - **Profile Management**: Store and update user personal information
                            - **User Preferences**: Manage fitness goals, equipment, and workout preferences
                            - **Comprehensive Validation**: Email format, password strength, and unique constraints
                            
                            ## User Data Model
                            - **Personal Info**: Username, email, date of birth, height, weight, gender
                            - **Fitness Profile**: Experience level, goals, preferred sport types
                            - **Equipment**: Available workout equipment for personalized planning
                            - **Preferences**: Workout duration, intensity, health notes
                            
                            ## Authentication Flow
                            1. Register a new account with `/api/v1/users/register`
                            2. Login with `/auth/login` to receive a JWT token
                            3. Include the JWT token in the Authorization header for protected endpoints
                            
                            ## Gender Options
                            Inclusive gender identification: MALE, FEMALE, NON_BINARY, PREFER_NOT_TO_SAY, OTHER
                            """)
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("FlexFit Development Team")
                                .email("dev@flexfit.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8080/user-service")
                                .description("Development server (via API Gateway)"),
                        new Server()
                                .url("http://localhost:8081")
                                .description("Development server (direct access)"),
                        new Server()
                                .url("https://api.flexfit.com")
                                .description("Production server")
                ))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes("bearerAuth", 
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT token for authentication. Obtain by calling /auth/login. Format: Bearer {token}")));
    }
}