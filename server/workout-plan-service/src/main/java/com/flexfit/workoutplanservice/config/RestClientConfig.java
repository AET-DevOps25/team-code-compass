package com.flexfit.workoutplanservice.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {

    // Injects the URL for the user-service from application.properties
    @Value("${flexfit.services.user-service.url}")
    private String userServiceUrl;

    // Injects the URL for the genai-service from application.properties
    @Value("${flexfit.services.genai-service.url}")
    private String genaiServiceUrl;

    /**
     * Creates a RestTemplate bean specifically for calling the user-service.
     * @return A configured RestTemplate instance.
     */
    @Bean
    @Qualifier("userSvcRestTemplate")
    public RestTemplate userSvcRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setUriTemplateHandler(new RootUriTemplateHandler(userServiceUrl));
        return restTemplate;
    }

    /**
     * Creates a RestTemplate bean specifically for calling the GenAI service.
     * @return A configured RestTemplate instance.
     */
    @Bean
    @Qualifier("genaiSvcRestTemplate")
    public RestTemplate genaiSvcRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setUriTemplateHandler(new RootUriTemplateHandler(genaiServiceUrl));
        return restTemplate;
    }
}