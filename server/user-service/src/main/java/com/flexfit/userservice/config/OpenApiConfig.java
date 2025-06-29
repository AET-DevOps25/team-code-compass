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
                        .description("User management service for the FlexFit fitness application")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("FlexFit Development Team")
                                .email("dev@flexfit.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:8000/api/users")
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
                                        .description("JWT token for OAuth2 authentication")));
    }
}