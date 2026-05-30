package com.texton.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tunables for large-book ingestion (multi-thousand page PDFs) and high-recall RAG.
 */
@ConfigurationProperties(prefix = "texton.indexing")
public class DocumentIndexingProperties {

    /** Maximum upload size in megabytes (validator + Spring multipart). */
    private int maxUploadMb = 250;

    /** Hard cap on pages extracted from a single file (safety valve). */
    private int maxPages = 6000;

    /** Maximum vector chunks stored per document. */
    private int maxChunksPerDocument = 10000;

    /** Target characters per chunk (larger = fewer embeddings for huge books). */
    private int chunkTargetChars = 3200;

    private int chunkOverlapChars = 280;

    /** Chunks retrieved before reranking (document Q&A). */
    private int queryRetrieveK = 36;

    /** Chunks sent to the LLM after reranking (document Q&A). */
    private int queryFinalK = 14;

    /** Study-tool retrieval before rerank. */
    private int studyRetrieveK = 48;

    /** Study-tool chunks after rerank. */
    private int studyFinalK = 18;

    /** Parallel embedding batch size during ingestion. */
    private int embeddingBatchSize = 10;

    /** Skip pages with fewer than this many extracted characters. */
    private int minPageChars = 25;

    /** Below this rerank score, refuse to call the LLM (anti-hallucination gate). */
    private double minRetrievalConfidence = 0.18;

    public long maxUploadBytes() {
        return maxUploadMb * 1024L * 1024L;
    }

    public int getMaxUploadMb() { return maxUploadMb; }
    public void setMaxUploadMb(int maxUploadMb) { this.maxUploadMb = maxUploadMb; }
    public int getMaxPages() { return maxPages; }
    public void setMaxPages(int maxPages) { this.maxPages = maxPages; }
    public int getMaxChunksPerDocument() { return maxChunksPerDocument; }
    public void setMaxChunksPerDocument(int maxChunksPerDocument) { this.maxChunksPerDocument = maxChunksPerDocument; }
    public int getChunkTargetChars() { return chunkTargetChars; }
    public void setChunkTargetChars(int chunkTargetChars) { this.chunkTargetChars = chunkTargetChars; }
    public int getChunkOverlapChars() { return chunkOverlapChars; }
    public void setChunkOverlapChars(int chunkOverlapChars) { this.chunkOverlapChars = chunkOverlapChars; }
    public int getQueryRetrieveK() { return queryRetrieveK; }
    public void setQueryRetrieveK(int queryRetrieveK) { this.queryRetrieveK = queryRetrieveK; }
    public int getQueryFinalK() { return queryFinalK; }
    public void setQueryFinalK(int queryFinalK) { this.queryFinalK = queryFinalK; }
    public int getStudyRetrieveK() { return studyRetrieveK; }
    public void setStudyRetrieveK(int studyRetrieveK) { this.studyRetrieveK = studyRetrieveK; }
    public int getStudyFinalK() { return studyFinalK; }
    public void setStudyFinalK(int studyFinalK) { this.studyFinalK = studyFinalK; }
    public int getEmbeddingBatchSize() { return embeddingBatchSize; }
    public void setEmbeddingBatchSize(int embeddingBatchSize) { this.embeddingBatchSize = embeddingBatchSize; }
    public int getMinPageChars() { return minPageChars; }
    public void setMinPageChars(int minPageChars) { this.minPageChars = minPageChars; }
    public double getMinRetrievalConfidence() { return minRetrievalConfidence; }
    public void setMinRetrievalConfidence(double minRetrievalConfidence) {
        this.minRetrievalConfidence = minRetrievalConfidence;
    }
}
