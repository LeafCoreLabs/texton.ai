package com.texton.backend.service;

import com.texton.backend.config.DocumentIndexingProperties;
import com.texton.backend.util.QueryIntent;
import com.texton.backend.util.QueryIntentParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * High-recall, low-hallucination retrieval for 1000s-of-page books:
 * page pinning, multi-vector search, hybrid BM25 rerank, confidence gating.
 */
@Service
public class DocumentRetrievalService {

    @Autowired
    private ChromaDB chromaDB;

    @Autowired
    private ParsingService parsingService;

    @Autowired
    private DocumentIndexingProperties props;

    public RetrievalResult retrieveForDocument(Long documentId, String queryText) {
        QueryIntent intent = QueryIntentParser.parse(queryText);
        List<List<Double>> queryVectors = buildQueryVectors(queryText, intent);

        List<String> excerpts = chromaDB.retrieveGrounded(
                documentId,
                queryText,
                intent,
                queryVectors,
                props.getQueryRetrieveK(),
                props.getQueryFinalK());

        double confidence = chromaDB.lastRetrievalConfidence();
        boolean sufficient = !excerpts.isEmpty()
                && !excerpts.get(0).startsWith("No indexed")
                && confidence >= props.getMinRetrievalConfidence();

        return new RetrievalResult(excerpts, confidence, sufficient, intent);
    }

    public RetrievalResult retrieveForStudyPack(List<Long> documentIds, String queryText) {
        QueryIntent intent = QueryIntentParser.parse(queryText);
        List<List<Double>> queryVectors = buildQueryVectors(queryText, intent);

        List<String> excerpts = chromaDB.retrieveGroundedPack(
                documentIds,
                queryText,
                intent,
                queryVectors,
                props.getStudyRetrieveK(),
                props.getStudyFinalK());

        double confidence = chromaDB.lastRetrievalConfidence();
        boolean sufficient = confidence >= props.getMinRetrievalConfidence()
                && !excerpts.isEmpty();

        return new RetrievalResult(excerpts, confidence, sufficient, intent);
    }

    private List<List<Double>> buildQueryVectors(String queryText, QueryIntent intent) {
        Set<String> variants = new LinkedHashSet<>();
        variants.add(queryText);
        variants.add("Definitions, explanations, and examples about: " + queryText);
        if (intent.targetPage().isPresent()) {
            int p = intent.targetPage().getAsInt();
            variants.add("Content on page " + p + " " + queryText);
        }
        List<List<Double>> vectors = new ArrayList<>();
        for (String v : variants) {
            vectors.add(parsingService.generateEmbedding(v));
        }
        return vectors;
    }

    public record RetrievalResult(
            List<String> excerpts,
            double confidence,
            boolean sufficientEvidence,
            QueryIntent intent
    ) {}
}
