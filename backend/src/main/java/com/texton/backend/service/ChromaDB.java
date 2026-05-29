package com.texton.backend.service;

import com.texton.backend.config.DocumentIndexingProperties;
import com.texton.backend.util.IndexedChunk;
import com.texton.backend.util.QueryIntent;
import com.texton.backend.util.RetrievalReranker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * In-process vector index with per-page chunk lookup for pinned page queries.
 */
@Component
public class ChromaDB {

    @Autowired
    private DocumentIndexingProperties props;

    private final Map<Long, List<IndexedChunk>> documentChunks = new HashMap<>();
    private final Map<Long, List<List<Double>>> documentEmbeddings = new HashMap<>();
    /** docId -> page number -> chunk indices overlapping that page */
    private final Map<Long, Map<Integer, Set<Integer>>> pageIndex = new HashMap<>();

    private double lastRetrievalConfidence = 0.0;

    public double lastRetrievalConfidence() {
        return lastRetrievalConfidence;
    }

    public void save(Long docId, List<IndexedChunk> chunks, List<List<Double>> embeddings) {
        documentChunks.put(docId, new ArrayList<>(chunks));
        documentEmbeddings.put(docId, new ArrayList<>(embeddings));
        pageIndex.put(docId, buildPageIndex(chunks));
    }

    public void delete(Long docId) {
        documentChunks.remove(docId);
        documentEmbeddings.remove(docId);
        pageIndex.remove(docId);
    }

    public int chunkCount(Long docId) {
        List<IndexedChunk> c = documentChunks.get(docId);
        return c == null ? 0 : c.size();
    }

    public List<String> retrieveGrounded(
            Long docId,
            String queryText,
            QueryIntent intent,
            List<List<Double>> queryVectors,
            int retrieveK,
            int finalK
    ) {
        List<IndexedChunk> chunks = documentChunks.get(docId);
        List<List<Double>> vectors = documentEmbeddings.get(docId);

        if (chunks == null || vectors == null || chunks.isEmpty()) {
            lastRetrievalConfidence = 0.0;
            return List.of("No indexed content found for this document.");
        }

        Set<Integer> mandatory = resolveMandatoryChunkIndices(docId, intent, chunks);
        if (intent != null && intent.hasPageFilter() && mandatory.isEmpty()) {
            lastRetrievalConfidence = 0.0;
            return List.of();
        }

        RetrievalReranker.Result result = RetrievalReranker.rerank(
                queryText, intent, chunks, vectors, queryVectors, retrieveK, finalK, mandatory);
        lastRetrievalConfidence = result.confidence();
        return result.excerpts();
    }

    public List<String> retrieveGroundedPack(
            List<Long> docIds,
            String queryText,
            QueryIntent intent,
            List<List<Double>> queryVectors,
            int retrieveK,
            int finalK
    ) {
        List<IndexedChunk> allChunks = new ArrayList<>();
        List<List<Double>> allVectors = new ArrayList<>();
        Set<Integer> mandatoryGlobal = new HashSet<>();

        for (Long docId : docIds) {
            List<IndexedChunk> chunks = documentChunks.get(docId);
            List<List<Double>> vectors = documentEmbeddings.get(docId);
            if (chunks == null || vectors == null) continue;

            int offset = allChunks.size();
            Set<Integer> localMandatory = resolveMandatoryChunkIndices(docId, intent, chunks);

            for (int i = 0; i < chunks.size(); i++) {
                IndexedChunk c = chunks.get(i);
                allChunks.add(new IndexedChunk(
                        c.index(),
                        c.pageStart(),
                        c.pageEnd(),
                        "[Doc " + docId + "] " + c.text()
                ));
                allVectors.add(vectors.get(i));
            }
            for (int localIdx : localMandatory) {
                mandatoryGlobal.add(offset + localIdx);
            }
        }

        if (allChunks.isEmpty()) {
            lastRetrievalConfidence = 0.0;
            return List.of("No indexed content found for this study pack.");
        }

        if (intent != null && intent.hasPageFilter() && mandatoryGlobal.isEmpty()) {
            lastRetrievalConfidence = 0.0;
            return List.of();
        }

        RetrievalReranker.Result result = RetrievalReranker.rerank(
                queryText, intent, allChunks, allVectors, queryVectors,
                Math.min(retrieveK, allChunks.size()), finalK, mandatoryGlobal);
        lastRetrievalConfidence = result.confidence();
        return result.excerpts();
    }

    private Set<Integer> resolveMandatoryChunkIndices(Long docId, QueryIntent intent, List<IndexedChunk> chunks) {
        Set<Integer> mandatory = new LinkedHashSet<>();
        if (intent == null || !intent.hasPageFilter()) return mandatory;

        Map<Integer, Set<Integer>> idx = pageIndex.get(docId);
        if (idx == null) return mandatory;

        if (intent.targetPage().isPresent()) {
            int p = intent.targetPage().getAsInt();
            addPageChunks(mandatory, idx, p);
            addPageChunks(mandatory, idx, p - 1);
            addPageChunks(mandatory, idx, p + 1);
        }

        if (intent.pageRangeStart().isPresent() && intent.pageRangeEnd().isPresent()) {
            int lo = intent.pageRangeStart().getAsInt();
            int hi = intent.pageRangeEnd().getAsInt();
            for (int p = lo; p <= hi; p++) {
                addPageChunks(mandatory, idx, p);
            }
        }

        for (int i : mandatory) {
            if (i < 0 || i >= chunks.size()) mandatory.remove(i);
        }
        return mandatory;
    }

    private static void addPageChunks(Set<Integer> target, Map<Integer, Set<Integer>> idx, int page) {
        if (page < 1) return;
        Set<Integer> set = idx.get(page);
        if (set != null) target.addAll(set);
    }

    private static Map<Integer, Set<Integer>> buildPageIndex(List<IndexedChunk> chunks) {
        Map<Integer, Set<Integer>> idx = new HashMap<>();
        for (int i = 0; i < chunks.size(); i++) {
            IndexedChunk c = chunks.get(i);
            if (c.pageStart() <= 0) continue;
            for (int p = c.pageStart(); p <= c.pageEnd(); p++) {
                idx.computeIfAbsent(p, k -> new LinkedHashSet<>()).add(i);
            }
        }
        return idx;
    }

    /** Direct fetch for API: all text indexed for a single page. */
    public List<String> excerptsForPage(Long docId, int page) {
        Map<Integer, Set<Integer>> idx = pageIndex.get(docId);
        List<IndexedChunk> chunks = documentChunks.get(docId);
        if (idx == null || chunks == null) return List.of();
        Set<Integer> indices = idx.get(page);
        if (indices == null || indices.isEmpty()) return List.of();
        List<String> out = new ArrayList<>();
        for (int i : indices) {
            if (i >= 0 && i < chunks.size()) out.add(chunks.get(i).forRetrieval());
        }
        return out;
    }

    public List<String> queryReranked(Long docId, List<Double> queryVector, String queryText,
                                      int retrieveK, int finalK) {
        return retrieveGrounded(docId, queryText, null, List.of(queryVector), retrieveK, finalK);
    }

    public List<String> queryTopK(Long docId, List<Double> queryVector, int topK) {
        return queryReranked(docId, queryVector, "", topK, topK);
    }

    public List<String> query(Long docId, List<Double> queryVector) {
        return queryReranked(docId, queryVector, "", props.getQueryRetrieveK(), props.getQueryFinalK());
    }

    public List<String> queryDocumentsReranked(List<Long> docIds, List<Double> queryVector, String queryText,
                                               int retrieveK, int finalK) {
        return retrieveGroundedPack(docIds, queryText, null, List.of(queryVector), retrieveK, finalK);
    }

    public List<String> queryDocuments(List<Long> docIds, List<Double> queryVector, int topK) {
        return queryDocumentsReranked(docIds, queryVector, "", topK, topK);
    }
}
