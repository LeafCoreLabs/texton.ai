package com.texton.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

/**
 * Embedding service:
 * - MOCK mode: deterministic 384-dim pseudo-embeddings (no external deps)
 * - Real: swap logic to call your embedding API
 */
@Service
public class EmbeddingService {

    @Value("${ai.mode:MOCK}")
    private String mode;

    // ----- PUBLIC API -----

    public List<double[]> embedChunks(List<String> chunks) {
        List<double[]> result = new ArrayList<>();
        for (String c : chunks) {
            result.add(embed(c));
        }
        return result;
    }

    public double[] embed(String text) {
        if ("REAL".equalsIgnoreCase(mode)) {
            // TODO: call real embedding provider here (e.g., local service, OpenAI, etc.)
            // return realEmbedding(text);
        }
        return mockEmbedding(text);
    }

    // ----- MOCK embedding (stable, deterministic) -----

    private double[] mockEmbedding(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(text.getBytes(StandardCharsets.UTF_8));
            int dim = 384;
            double[] v = new double[dim];
            for (int i = 0; i < dim; i++) {
                v[i] = ((int) hash[i % hash.length]) / 128.0; // [-1..1]-ish
            }
            // quick L2 normalize
            double norm = 0;
            for (double x : v) norm += x * x;
            norm = Math.sqrt(norm) + 1e-9;
            for (int i = 0; i < dim; i++) v[i] /= norm;
            return v;
        } catch (Exception e) {
            // fallback tiny vector if anything weird happens
            return new double[]{1.0};
        }
    }
}
