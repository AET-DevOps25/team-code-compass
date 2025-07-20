package com.flexfit.ttsservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
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
                        .title("FlexFit TTS Service API")
                        .description("Text-to-Speech service for converting workout text to audio using Google Cloud TTS")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("FlexFit Team")
                                .email("flexfit@tum.de"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8083")
                                .description("Local Development Server"),
                        new Server()
                                .url("http://localhost:8080/api/tts")
                                .description("API Gateway Server")
                ));
    }
} 