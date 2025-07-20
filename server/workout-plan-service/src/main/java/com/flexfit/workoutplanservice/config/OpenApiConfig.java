package com.flexfit.workoutplanservice.config;

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
                        .title("FlexFit Workout Plan Service API")
                        .description("""
                            AI-powered workout planning and exercise management service for the FlexFit fitness application.
                            
                            ## Features
                            - **Daily Workout Generation**: Create personalized daily workouts using AI
                            - **Weekly Plan Generation**: Generate comprehensive 7-day workout plans
                            - **Dual AI Support**: Choose between cloud AI (Claude/OpenAI) or local AI (GPT4All/Ollama)
                            - **User Preference Integration**: Workouts adapted to user preferences, equipment, and fitness level
                            - **Progress Tracking**: Store and retrieve workout completion data
                            
                            ## AI Preference Options
                            - **cloud**: Uses cloud-based AI models (Claude, OpenAI) for advanced reasoning
                            - **local**: Uses local AI models for privacy-preserving workout generation
                            
                            ## Authentication
                            All endpoints (except health checks) require a valid JWT token in the Authorization header.
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
                                .url("http://localhost:8082")
                                .description("Development server (direct access)"),
                        new Server()
                                .url("http://localhost:8080/workout-plan-service")
                                .description("Development server (via API Gateway)"),
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
                                        .description("JWT token for API authentication. Format: Bearer {token}")));
    }
}
