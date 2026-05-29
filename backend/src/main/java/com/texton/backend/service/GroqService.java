package com.texton.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    private static final String GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${groq.api-key:}")
    private String apiKey;

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String model;

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String chat(String systemPrompt, String userPrompt) {
        return chat(systemPrompt, userPrompt, 0.5);
    }

    /** Low temperature for grounded document Q&A (reduces hallucination). */
    public String chatGrounded(String systemPrompt, String userPrompt) {
        return chat(systemPrompt, userPrompt, 0.08);
    }

    public String chat(String systemPrompt, String userPrompt, double temperature) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));
        messages.add(Map.of("role", "user", "content", userPrompt));
        return chatMessages(messages, temperature);
    }

    /** Multi-turn chat: each map has "role" (system|user|assistant) and "content". */
    public String chatMessages(List<Map<String, String>> messages) {
        return chatMessages(messages, 0.5);
    }

    public String chatMessages(List<Map<String, String>> messages, double temperature) {
        if (!isEnabled()) {
            throw new IllegalStateException("Groq API key is not configured");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            List<Map<String, String>> apiMessages = new ArrayList<>();
            for (Map<String, String> m : messages) {
                apiMessages.add(Map.of("role", m.get("role"), "content", m.get("content")));
            }

            Map<String, Object> body = Map.of(
                    "model", model,
                    "messages", apiMessages,
                    "temperature", temperature,
                    "max_tokens", 2048
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(GROQ_CHAT_URL, request, String.class);

            JsonNode root = mapper.readTree(response.getBody());
            return root.get("choices").get(0).get("message").get("content").asText();
        } catch (Exception e) {
            throw new RuntimeException("Groq API failed: " + e.getMessage(), e);
        }
    }
}
