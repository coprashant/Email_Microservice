package com.example.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.HashMap;
import java.util.Map;

/**
 * Example spring boot client for email microservice
 * Set base url and api key in application configuration
 * Inject this service and call sendemail for transactional delivery
 */
@Service
public class EmailServiceClient {

    private final RestTemplate restTemplate;

    @Value("${email.service.base-url}")
    private String baseUrl;

    @Value("${email.service.api-key}")
    private String apiKey;

    public EmailServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Send transactional email through shared email microservice
     * Params include to subject body html and sendername values
     * Return true when service reports successful delivery request
     */
    public boolean sendEmail(String to, String subject, String body, String html, String senderName) {
        String url = baseUrl + "/api/v1/send-email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("to", to);
        payload.put("subject", subject);
        if (body != null) payload.put("body", body);
        if (html != null) payload.put("html", html);
        if (senderName != null) payload.put("senderName", senderName);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (HttpStatusCodeException ex) {
            // Log response body for validation auth or provider errors
            System.err.println("Email microservice error [" + ex.getStatusCode() + "]: " + ex.getResponseBodyAsString());
            return false;
        }
    }
}

/*
 * Resttemplate bean example for applications that need this client
 * Configuration annotation and bean annotation can provide instance
 * Other services can call sendemail and handle false return values
 */
