package com.flexfit.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springdoc.core.properties.SwaggerUiConfigProperties;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.HashMap;

@RestController
public class SwaggerConfigController {

    @Autowired
    private SwaggerUiConfigProperties swaggerUiConfigProperties;

    @GetMapping("/v3/api-docs/swagger-config")
    public ResponseEntity<Map<String, Object>> getSwaggerConfig(HttpServletRequest request) {
        Map<String, Object> config = new HashMap<>();
        
        // Determine if we're being accessed through the API Gateway
        String requestURI = request.getRequestURI();
        String contextPath = request.getContextPath();
        
        // Always use relative paths - works for both direct and gateway access
        String basePath = "./v3/api-docs";
        
        config.put("configUrl", basePath + "/swagger-config");
        config.put("url", basePath);
        config.put("filter", swaggerUiConfigProperties.getFilter());
        config.put("tryItOutEnabled", swaggerUiConfigProperties.getTryItOutEnabled());
        config.put("validatorUrl", swaggerUiConfigProperties.getValidatorUrl());
        
        // Build OAuth2 redirect URL
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String oauth2RedirectUrl = String.format("%s://%s:%d%s/swagger-ui/oauth2-redirect.html", 
                                                scheme, serverName, serverPort, contextPath);
        config.put("oauth2RedirectUrl", oauth2RedirectUrl);
        
        return ResponseEntity.ok(config);
    }
} 