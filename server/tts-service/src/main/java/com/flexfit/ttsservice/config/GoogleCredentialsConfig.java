package com.flexfit.ttsservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.Base64;

@Configuration
public class GoogleCredentialsConfig {

    @Bean
    public GoogleCredentials googleCredentials() throws IOException {
        // Option 1: Use environment variable (base64 encoded)
        String credentialsJson = System.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON");
        if (credentialsJson != null && !credentialsJson.isEmpty()) {
            try {
                // Decode base64 string
                byte[] decodedBytes = Base64.getDecoder().decode(credentialsJson);
                return GoogleCredentials.fromStream(new ByteArrayInputStream(decodedBytes));
            } catch (IllegalArgumentException e) {
                // If not base64, try as plain JSON
                return GoogleCredentials.fromStream(
                    new ByteArrayInputStream(credentialsJson.getBytes())
                );
            }
        }
        
        // Option 2: Use local file path
        String credentialsPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS_PATH");
        if (credentialsPath != null && !credentialsPath.isEmpty()) {
            return GoogleCredentials.fromStream(new FileInputStream(credentialsPath));
        }
        
        // Option 3: Fallback to default credentials (for local development)
        return GoogleCredentials.getApplicationDefault();
    }
} 