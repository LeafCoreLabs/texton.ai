package com.texton.backend.service;

import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayInputStream;
import java.util.*;

@Service
public class ParsingService {

    private final Tika tika = new Tika();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${gemini.api-key}")
    private String GEMINI_API_KEY;

    @Autowired
    private ChromaDB chromaDB;  // ✅ Spring Bean, not static

    private static final String GEMINI_CHAT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    private static final String GEMINI_EMBED_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=";

    // ✅ Extract text using Apache Tika
    public String extractTextFromS3(byte[] fileBytes, String fileName) throws Exception {
        return tika.parseToString(new ByteArrayInputStream(fileBytes));
    }

    // ✅ Call Gemini embedding API
    public List<Double> generateEmbedding(String text) {
        try {
            String url = GEMINI_EMBED_URL + GEMINI_API_KEY;

            Map<String, Object> body = Map.of(
                    "content", Map.of("parts", List.of(Map.of("text", text)))
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            JsonNode jsonNode = mapper.readTree(response.getBody());
            JsonNode embeddingArray = jsonNode.get("embedding").get("values");

            List<Double> vector = new ArrayList<>();
            embeddingArray.forEach(val -> vector.add(val.asDouble()));

            return vector;

        } catch (Exception e) {
            throw new RuntimeException("❌ Gemini Embedding API failed: " + e.getMessage());
        }
    }

    // ✅ Save embeddings into ChromaDB (in-memory)
    public void saveToChroma(Long documentId, List<String> chunks, List<List<Double>> vectors) {
        chromaDB.save(documentId, chunks, vectors);  // ✅ no static calls
    }

    // ✅ Retrieve matching chunks
    public List<String> queryChromaDB(Long documentId, List<Double> queryVector) {
        return chromaDB.query(documentId, queryVector);  // ✅ no static calls
    }

    // ✅ Chat with Gemini using matched chunks
    public String askGemini(String query, List<String> matchedChunks) {
        try {
            String url = GEMINI_CHAT_URL + GEMINI_API_KEY;

            String finalPrompt =
                    "Relevant extracted document text:\n\n" +
                            String.join("\n\n", matchedChunks) +
                            "\n\nUser question: " + query;

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", finalPrompt)
                            ))
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            JsonNode jsonNode = mapper.readTree(response.getBody());
            return jsonNode.get("candidates").get(0).get("content").get("parts").get(0).get("text").asText();

        } catch (Exception e) {
            return "❌ Gemini Chat API failed: " + e.getMessage();
        }
    }
}
