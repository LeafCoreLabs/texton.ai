package com.texton.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Minimal ChromaDB HTTP client (create collection, upsert, query).
 * Works with your dockerized chromadb:latest.
 */
@Service
public class VectorStoreService {

    @Value("${ai.chromadb.url:http://localhost:8000}")
    private String chromaUrl;

    @Value("${ai.chromadb.collection:user-document-embeddings}")
    private String collection;

    private final RestTemplate http = new RestTemplate();

    // Create collection if not exists
    public void ensureCollection() {
        try {
            Map<String,Object> body = Map.of("name", collection, "metadata", Map.of());
            http.postForEntity(chromaUrl + "/api/v1/collections", body, Map.class);
        } catch (Exception ignore) {
            // Already exists most likely
        }
    }

    /**
     * Upsert embeddings for a document: ids, embeddings, and texts.
     * @param docId document id
     * @param chunkIds ids like docId#0, docId#1...
     * @param vectors double[dim]
     * @param texts raw chunk texts
     */
    public void upsert(String docId, List<String> chunkIds, List<double[]> vectors, List<String> texts) {
        ensureCollection();

        Map<String, Object> payload = new HashMap<>();
        payload.put("ids", chunkIds);
        payload.put("metadatas", textsToMetadata(docId, texts));
        payload.put("documents", texts);
        payload.put("embeddings", vectors);

        http.postForEntity(
                chromaUrl + "/api/v1/collections/" + collection + "/upsert",
                payload, Map.class
        );
    }

    /**
     * Query topK most similar chunks for a query embedding.
     */
    @SuppressWarnings("unchecked")
    public List<String> queryTopK(double[] queryVector, int topK) {
        ensureCollection();

        Map<String, Object> payload = new HashMap<>();
        payload.put("query_embeddings", List.of(queryVector));
        payload.put("n_results", topK);

        ResponseEntity<Map> resp = http.postForEntity(
                chromaUrl + "/api/v1/collections/" + collection + "/query",
                payload, Map.class
        );

        Map<String, Object> body = resp.getBody();
        if (body == null) return List.of();

        // Chroma returns lists for each query; we did 1 query → index 0
        List<List<String>> docs = (List<List<String>>) body.get("documents");
        if (docs == null || docs.isEmpty()) return List.of();
        return docs.get(0);
    }

    private List<Map<String, Object>> textsToMetadata(String docId, List<String> texts) {
        List<Map<String, Object>> metas = new ArrayList<>();
        for (int i = 0; i < texts.size(); i++) {
            metas.add(Map.of("documentId", docId, "chunkIndex", i));
        }
        return metas;
    }
}
