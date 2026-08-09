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
 * Example Spring Boot client for the Email Microservice.
 *
 * Usage (application.properties / application.yml):
 *   email.service.base-url=https://your-email-microservice.onrender.com
 *   email.service.api-key=your_service_api_key
 *
 * Then inject and call:
 *   emailServiceClient.sendEmail(
 *       "user@example.com",
 *       "Welcome to DasKitta!",
 *       "Hi there, welcome aboard.",
 *       "<h1>Hi there</h1><p>Welcome aboard.</p>",
 *       "DasKitta Support"
 *   );
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
     * Sends a transactional email through the shared Email Microservice.
     *
     * @param to          recipient email address
     * @param subject     email subject line
     * @param body        plain text body (nullable if html is provided)
     * @param html        HTML body (nullable if body is provided)
     * @param senderName  display name shown as the sender (nullable)
     * @return true if the microservice reported success
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
            // Log the response body for debugging (validation errors, auth
            // failures, or Gmail API errors surfaced by the microservice)
            System.err.println("Email microservice error [" + ex.getStatusCode() + "]: " + ex.getResponseBodyAsString());
            return false;
        }
    }
}

/*
 * -----------------------------------------------------------------
 * RestTemplate bean configuration (if you don't already have one):
 * -----------------------------------------------------------------
 *
 * @Configuration
 * public class RestTemplateConfig {
 *     @Bean
 *     public RestTemplate restTemplate() {
 *         return new RestTemplate();
 *     }
 * }
 *
 * -----------------------------------------------------------------
 * Example call from another service/controller:
 * -----------------------------------------------------------------
 *
 * boolean sent = emailServiceClient.sendEmail(
 *     "customer@example.com",
 *     "Your order has shipped!",
 *     "Your order #1234 has shipped.",
 *     "<p>Your order <b>#1234</b> has shipped.</p>",
 *     "DasKitta Support"
 * );
 *
 * if (!sent) {
 *     // handle failure: retry, log, alert, etc.
 * }
 */
