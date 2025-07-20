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

    // Injects the URLs for the GenAI services from application.properties
    @Value("${flexfit.services.genai-service.cloud.url}")
    private String genaiCloudServiceUrl;
    
    @Value("${flexfit.services.genai-service.local.url}")
    private String genaiLocalServiceUrl;

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
     * Creates a RestTemplate bean specifically for calling the Cloud GenAI service (Claude/OpenAI).
     * @return A configured RestTemplate instance.
     */
    @Bean
    @Qualifier("genaiCloudRestTemplate")
    public RestTemplate genaiCloudRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setUriTemplateHandler(new RootUriTemplateHandler(genaiCloudServiceUrl));
        return restTemplate;
    }
    
    /**
     * Creates a RestTemplate bean specifically for calling the Local GenAI service (GPT4All/Ollama).
     * @return A configured RestTemplate instance.
     */
    @Bean
    @Qualifier("genaiLocalRestTemplate")
    public RestTemplate genaiLocalRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setUriTemplateHandler(new RootUriTemplateHandler(genaiLocalServiceUrl));
        return restTemplate;
    }

    /**
     * Legacy RestTemplate for backward compatibility.
     * @deprecated Use genaiCloudRestTemplate or genaiLocalRestTemplate instead.
     */
    @Bean
    @Qualifier("genaiSvcRestTemplate")
    @Deprecated
    public RestTemplate genaiSvcRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setUriTemplateHandler(new RootUriTemplateHandler(genaiCloudServiceUrl));
        return restTemplate;
    }
}