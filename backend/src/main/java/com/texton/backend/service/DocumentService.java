package com.texton.backend.service;

import com.texton.backend.models.Document;
import com.texton.backend.models.User;
import com.texton.backend.repositories.DocumentRepository;
import com.texton.backend.websocket.DocumentStatusSse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

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
    private DocumentStatusSse documentStatusSse; // << NEW

    public List<Document> getDocumentsByUserId(Long userId) {
        return documentRepository.findByUserIdOrderByUploadDateDesc(userId);
    }

    public Document uploadAndProcessDocument(MultipartFile file, String username) {
        User user = authService.getUserByUsername(username);

        log.debug("🗂️ Uploading document: {} by user: {}", file.getOriginalFilename(), username);

        Document doc = new Document();
        doc.setUser(user);
        doc.setFileName(file.getOriginalFilename());
        doc.setS3Key(s3Service.uploadFile(file, user.getId()));
        doc.setStatus(Document.DocumentStatus.PROCESSING);
        doc.setSizeInKB(file.getSize() / 1024);

        Document savedDoc = documentRepository.save(doc);
        log.debug("✅ Document saved with ID: {}, Status: {}", savedDoc.getId(), savedDoc.getStatus());
        log.debug("🚀 ASYNC PROCESS STARTED — docId={}", savedDoc.getId());

        processDocumentAsync(savedDoc);

        return savedDoc;
    }

    @Async
    public void processDocumentAsync(Document doc) {
        try {
            byte[] fileBytes = s3Service.downloadFile(doc.getS3Key());
            log.debug("📥 File downloaded — size={} bytes", fileBytes.length);

            String extractedText = parsingService.extractTextFromS3(fileBytes, doc.getFileName());
            log.debug("📄 Text extracted — length={} chars", extractedText.length());

            // Simple chunking: single chunk
            List<String> chunks = List.of(extractedText);

            // Create one embedding for now
            List<List<Double>> vectors = new ArrayList<>();
            vectors.add(parsingService.generateEmbedding(extractedText));
            log.debug("🧠 Embedding generated — vector size={}", vectors.get(0).size());

            // Save to mock/vector store
            parsingService.saveToChroma(doc.getId(), chunks, vectors);

            // update status
            doc.setStatus(Document.DocumentStatus.PROCESSED);
            documentRepository.save(doc);
            log.debug("✅ Document PROCESSED successfully — docId={}", doc.getId());

            // 🔔 push SSE
            documentStatusSse.sendStatus(doc.getId(), "PROCESSED");

        } catch (Exception e) {
            log.error("💥 Error processing document docId={} — {}", doc.getId(), e.getMessage(), e);
            doc.setStatus(Document.DocumentStatus.FAILED);
            documentRepository.save(doc);

            // 🔔 push SSE
            documentStatusSse.sendStatus(doc.getId(), "FAILED");
        }
    }

    public String queryDocument(Long documentId, String query, String username) {
        User user = authService.getUserByUsername(username);

        Document doc = documentRepository.findById(documentId).orElse(null);
        if (doc == null) return "Document not found.";

        if (!doc.getUser().getId().equals(user.getId())) {
            return "Unauthorized access.";
        }

        if (doc.getStatus() == Document.DocumentStatus.PROCESSING)
            return "⏳ Document is still processing… Please wait.";

        if (doc.getStatus() == Document.DocumentStatus.FAILED)
            return "❌ Document processing failed. Try uploading again.";

        List<Double> queryVector = parsingService.generateEmbedding(query);
        List<String> matchedChunks = parsingService.queryChromaDB(documentId, queryVector);

        return parsingService.askGemini(query, matchedChunks);
    }
}
