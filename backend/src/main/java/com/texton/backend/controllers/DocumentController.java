package com.texton.backend.controllers;

import com.texton.backend.models.Document;
import com.texton.backend.service.DocumentService;
import com.texton.backend.service.AuthService;
import com.texton.backend.repositories.DocumentRepository;
import com.texton.backend.websocket.DocumentStatusSse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    @Autowired
    private DocumentStatusSse documentStatusSse;

    @Autowired
    private AuthService authService;

    @Autowired
    private DocumentRepository documentRepository;

    // ============================================================
    // ✅ LIST USER DOCUMENTS (GET /api/documents)
    // ============================================================
    @GetMapping("/documents")
    public ResponseEntity<List<Document>> getAllUserDocuments(@RequestHeader("Authorization") String token) {

        String cleanToken = token.replace("Bearer ", "").trim();
        String username = authService.getUsernameFromToken(cleanToken);

        Long userId = authService.getUserByUsername(username).getId();
        List<Document> documents = documentService.getDocumentsByUserId(userId);

        return ResponseEntity.ok(documents);
    }

    // ============================================================
    // ✅ UPLOAD DOCUMENT (POST /api/upload)
    // ============================================================
    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("Authorization") String token) {

        String cleanToken = token.replace("Bearer ", "").trim();
        String username = authService.getUsernameFromToken(cleanToken);

        Document newDoc = documentService.uploadAndProcessDocument(file, username);

        return ResponseEntity.ok(Map.of(
                "message", "File uploaded and sent for AI processing.",
                "documentId", newDoc.getId()
        ));
    }

    // ============================================================
    // ✅ QUERY DOCUMENT (POST /api/query)
    // ============================================================
    @PostMapping("/query")
    public ResponseEntity<?> queryDocument(
            @RequestBody DocumentQueryRequest queryRequest,
            @RequestHeader("Authorization") String token) {

        String cleanToken = token.replace("Bearer ", "").trim();
        String username = authService.getUsernameFromToken(cleanToken);

        String answer = documentService.queryDocument(
                queryRequest.getDocumentId(),
                queryRequest.getQuery(),
                username
        );

        return ResponseEntity.ok(Map.of("answer", answer));
    }


    // ============================================================
    // ✅ DOCUMENT STATUS STREAM (SSE)
    // ✅ GET /api/documents/{documentId}/stream?token=JWT
    // ============================================================
    @GetMapping(path = "/documents/{documentId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamDocumentStatus(@PathVariable Long documentId,
                                           @RequestParam String token) {

        String cleanToken = token.replace("Bearer ", "").trim();
        String username = authService.getUsernameFromToken(cleanToken);

        Document doc = documentRepository.findById(documentId).orElse(null);

        if (doc == null || !doc.getUser().getUsername().equals(username)) {
            SseEmitter denied = new SseEmitter(0L);
            denied.complete();
            return denied;
        }

        return documentStatusSse.subscribe(documentId);
    }


    // DTO
    public static class DocumentQueryRequest {
        private Long documentId;
        private String query;

        public Long getDocumentId() { return documentId; }
        public void setDocumentId(Long documentId) { this.documentId = documentId; }

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
    }
}
