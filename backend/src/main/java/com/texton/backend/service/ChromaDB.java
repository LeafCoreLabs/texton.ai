package com.texton.backend.service;

import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ChromaDB {

    // Memory store: docId → chunks (text)
    private static final Map<Long, List<String>> documentChunks = new HashMap<>();

    // Memory store: docId → embeddings (vectors)
    private static final Map<Long, List<List<Double>>> documentEmbeddings = new HashMap<>();

    /** Save text chunks + embeddings */
    public void save(Long docId, List<String> chunks, List<List<Double>> embeddings) {
        documentChunks.put(docId, chunks);
        documentEmbeddings.put(docId, embeddings);
    }

    /** Query most relevant chunk using dot product similarity */
    public List<String> query(Long docId, List<Double> queryVector) {

        List<List<Double>> vectors = documentEmbeddings.get(docId);
        List<String> chunks = documentChunks.get(docId);

        if (vectors == null || chunks == null) {
            return List.of("No indexed content found for this document.");
        }

        double bestScore = -1;
        String bestMatch = chunks.get(0);

        for (int i = 0; i < vectors.size(); i++) {
            double score = cosineSimilarity(queryVector, vectors.get(i));
            if (score > bestScore) {
                bestScore = score;
                bestMatch = chunks.get(i);
            }
        }

        return List.of(bestMatch);
    }

    private double cosineSimilarity(List<Double> a, List<Double> b) {
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.size(); i++) {
            dot += a.get(i) * b.get(i);
            normA += a.get(i) * a.get(i);
            normB += b.get(i) * b.get(i);
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
