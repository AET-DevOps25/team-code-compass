package com.flexfit.workoutplanservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                // CORS is handled by API Gateway - disabling here to prevent duplicate headers
                // .cors(cors -> cors.and()) 
                .authorizeHttpRequests(authorize -> authorize
                        // Allow public access to swagger endpoints for testing
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // For development: Allow all requests (disable authentication)
                        .anyRequest().permitAll()
                )
                // Disable OAuth2 JWT for development
                // .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }
}
