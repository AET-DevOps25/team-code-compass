package com.flexfit.workoutplanservice.config;

import org.springframework.web.util.DefaultUriBuilderFactory;
import org.springframework.web.util.UriTemplateHandler;

import java.net.URI;
import java.util.Map;

/**
 * A helper class to set a base URI for RestTemplate, so we can use relative paths in our calls.
 */
public class RootUriTemplateHandler implements UriTemplateHandler {

    private final UriTemplateHandler handler;

    public RootUriTemplateHandler(String baseUrl) {
        this.handler = new DefaultUriBuilderFactory(baseUrl);
    }

    @Override
    public URI expand(String uriTemplate, Map<String, ?> uriVariables) {
        return handler.expand(uriTemplate, uriVariables);
    }

    @Override
    public URI expand(String uriTemplate, Object... uriVariables) {
        return handler.expand(uriTemplate, uriVariables);
    }
}