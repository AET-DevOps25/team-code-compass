package com.flexfit.ttsservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.IOException;

@Configuration
public class GoogleCredentialsConfig {

    @Value("${GOOGLE_APPLICATION_CREDENTIALS_JSON:}")
    private String credentialsJson;

    @Bean
    public GoogleCredentials googleCredentials() throws IOException {
        if (credentialsJson != null && !credentialsJson.isEmpty()) {
            // Use environment variable JSON
            return GoogleCredentials.fromStream(
                new ByteArrayInputStream(credentialsJson.getBytes())
            );
        } else {
            // Fallback to default credentials (for local development)
            return GoogleCredentials.getApplicationDefault();
        }
    }
} 