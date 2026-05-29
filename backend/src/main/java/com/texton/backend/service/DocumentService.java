package com.texton.backend.service;

import com.texton.backend.config.DocumentIndexingProperties;
import com.texton.backend.models.Document;
import com.texton.backend.models.User;
import com.texton.backend.repositories.DocumentRepository;
import com.texton.backend.util.IndexedChunk;
import com.texton.backend.util.PageAwareExtractor;
import com.texton.backend.util.TextChunker;
import com.texton.backend.websocket.DocumentStatusSse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service("documentService")
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private S3Service s3Service;

    @Autowired
    private ParsingService parsingService;

    @Autowired
    private DocumentStatusSse documentStatusSse;

    @Autowired
    private PageAwareExtractor pageAwareExtractor;

    @Autowired
    private TextChunker textChunker;

    @Autowired
    private DocumentIndexingProperties indexingProps;

    @Autowired
    private DocumentRetrievalService documentRetrievalService;

    public List<Document> getDocumentsByUserId(Long userId) {
        return documentRepository.findByUserIdOrderByUploadDateDesc(userId);
    }

    public Document uploadAndProcessDocument(MultipartFile file, String username) {
        User user = authService.getUserByUsername(username);

        log.debug("Uploading document: {} by user: {}", file.getOriginalFilename(), username);

        Document doc = new Document();
        doc.setUser(user);
        String originalName = file.getOriginalFilename();
        doc.setFileName(originalName != null ? originalName : "document");
        doc.setS3Key(s3Service.uploadFile(file, user.getId()));
        doc.setStatus(Document.DocumentStatus.PROCESSING);
        doc.setSizeInKB(file.getSize() / 1024);

        Document savedDoc = documentRepository.save(doc);
        processDocumentAsync(savedDoc);

        return savedDoc;
    }

    @Async
    public void processDocumentAsync(Document doc) {
        try {
            byte[] fileBytes = s3Service.downloadFile(doc.getS3Key());
            documentStatusSse.sendProgress(doc.getId(), 2);

            PageAwareExtractor.ExtractionResult extraction =
                    pageAwareExtractor.extract(fileBytes, doc.getFileName());
            documentStatusSse.sendProgress(doc.getId(), 12);

            if (extraction.pages().isEmpty()) {
                throw new IllegalStateException(
                        "No extractable text found. Scanned PDFs may need OCR before upload.");
            }

            List<IndexedChunk> chunks = textChunker.chunkPages(extraction.pages());
            if (chunks.isEmpty()) {
                throw new IllegalStateException("Document produced no indexable text chunks.");
            }

            log.info("Indexing docId={} pages={}/{} chunks={} truncated={}",
                    doc.getId(), extraction.pagesIndexed(), extraction.pagesDetected(),
                    chunks.size(), extraction.truncatedByLimit());

            List<List<Double>> vectors = embedInBatches(doc, chunks);

            parsingService.saveToChroma(doc.getId(), chunks, vectors);

            doc.setStatus(Document.DocumentStatus.PROCESSED);
            doc.setPageCount(extraction.pagesIndexed());
            doc.setChunkCount(chunks.size());
            documentRepository.save(doc);
            documentStatusSse.sendProgress(doc.getId(), 100);
            documentStatusSse.sendStatus(doc.getId(), "PROCESSED");

        } catch (Exception e) {
            log.error("Error processing document docId={} — {}", doc.getId(), e.getMessage(), e);
            doc.setStatus(Document.DocumentStatus.FAILED);
            documentRepository.save(doc);
            documentStatusSse.sendStatus(doc.getId(), "FAILED");
        }
    }

    private List<List<Double>> embedInBatches(Document doc, List<IndexedChunk> chunks) {
        int batchSize = Math.max(1, indexingProps.getEmbeddingBatchSize());
        List<List<Double>> vectors = new ArrayList<>(chunks.size());
        int total = chunks.size();

        for (int i = 0; i < total; i += batchSize) {
            int end = Math.min(i + batchSize, total);
            for (int j = i; j < end; j++) {
                vectors.add(parsingService.generateEmbedding(chunks.get(j).text()));
            }
            int pct = 15 + (int) ((end * 80L) / total);
            documentStatusSse.sendProgress(doc.getId(), pct);
        }
        return vectors;
    }

    public String queryDocument(Long documentId, String query, String username) {
        return queryDocument(documentId, query, username, null);
    }

    public String queryDocument(Long documentId, String query, String username, String profileContext) {
        User user = authService.getUserByUsername(username);

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return "Document not found.";

        if (!doc.getUser().getId().equals(user.getId())) {
            return "Unauthorized access.";
        }

        if (doc.getStatus() == Document.DocumentStatus.PROCESSING) {
            return "Document is still indexing. Large books can take several minutes — watch the progress indicator.";
        }

        if (doc.getStatus() == Document.DocumentStatus.FAILED) {
            return "Document processing failed. Try uploading again.";
        }

        DocumentRetrievalService.RetrievalResult retrieval =
                documentRetrievalService.retrieveForDocument(documentId, query);

        if (!retrieval.sufficientEvidence()) {
            return insufficientEvidenceReply(doc, query, retrieval);
        }

        return parsingService.askGrounded(query, retrieval.excerpts(), profileContext);
    }

    public String generalChat(String query, List<java.util.Map<String, String>> history) {
        return parsingService.generalChat(query, history, null);
    }

    public String generalChat(String query, List<java.util.Map<String, String>> history, String profileContext) {
        return parsingService.generalChat(query, history, profileContext);
    }

    private String insufficientEvidenceReply(
            Document doc,
            String query,
            DocumentRetrievalService.RetrievalResult retrieval
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("I could not find enough matching text in your indexed upload to answer safely ");
        sb.append("(anti-hallucination mode).\n\n");

        if (retrieval.intent().hasPageFilter()) {
            sb.append("That page may be blank, scanned-as-image without OCR, or outside the indexed range. ");
            sb.append("Try: \"page N\" with a text-based PDF, or rephrase the topic with exact terms from the book.\n");
        } else {
            sb.append("Tips:\n");
            sb.append("• Ask about a **specific page** (e.g. \"What is on page 2847?\")\n");
            sb.append("• Use **exact phrases** from the book in quotes\n");
            sb.append("• Narrow the topic (chapter name, term, formula)\n");
        }

        if (doc.getPageCount() != null && doc.getChunkCount() != null) {
            sb.append("\nIndexed: ").append(doc.getPageCount()).append(" pages, ")
                    .append(doc.getChunkCount()).append(" passages.");
        }
        sb.append("\n\nYour question: ").append(query);
        return sb.toString();
    }

    /** Direct page lookup (all indexed passages overlapping a page). */
    public Map<String, Object> getPageExcerpts(Long documentId, int page, String username) {
        User user = authService.getUserByUsername(username);
        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return Map.of("error", "NOT_FOUND");
        if (!doc.getUser().getId().equals(user.getId())) return Map.of("error", "FORBIDDEN");
        if (doc.getStatus() != Document.DocumentStatus.PROCESSED) {
            return Map.of("error", "NOT_READY", "status", doc.getStatus().name());
        }
        List<String> excerpts = parsingService.excerptsForPage(documentId, page);
        return Map.of(
                "documentId", documentId,
                "page", page,
                "found", !excerpts.isEmpty(),
                "excerpts", excerpts,
                "pageCount", doc.getPageCount() != null ? doc.getPageCount() : 0
        );
    }

    public String deleteDocument(Long documentId, String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return "FORBIDDEN";

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return "NOT_FOUND";
        if (!doc.getUser().getId().equals(user.getId())) return "FORBIDDEN";

        documentStatusSse.disconnect(documentId);
        parsingService.deleteFromChroma(documentId);

        try {
            if (doc.getS3Key() != null && !doc.getS3Key().isBlank()) {
                s3Service.deleteFile(doc.getS3Key());
            }
        } catch (Exception e) {
            log.warn("Could not delete file for docId={}: {}", documentId, e.getMessage());
        }

        documentRepository.delete(doc);
        return null;
    }
}
