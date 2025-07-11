package com.flexfit.workoutplanservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// CORS is handled by API Gateway - completely disabling this configuration
// @Configuration
public class CorsConfig {

    // CORS is handled by API Gateway - commenting out to prevent duplicate headers
    /*
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOriginPatterns("*") // Allow all origins
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                    .allowedHeaders("*")
                    .allowCredentials(false) // Must be false when using wildcard origins
                    .maxAge(3600); // Cache preflight for 1 hour
            }
        };
    }
    */
} 