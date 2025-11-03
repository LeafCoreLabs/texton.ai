package com.texton.backend.controller;

import com.texton.backend.models.Document;
import com.texton.backend.service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication; // Key import for JWT security
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    // --- NEW ENDPOINT: GET /api/documents (The missing endpoint for 404) ---
    @GetMapping("/documents")
    public ResponseEntity<List<Document>> getAllUserDocuments(Authentication authentication) {
        String username = authentication.getName(); 
        
        Long userId = documentService.getUserByUsername(username).getId(); 

        List<Document> documents = documentService.getDocumentsByUserId(userId);
        
        return ResponseEntity.ok(documents);
    }
    // --------------------------------------------------------------------------

    // --- POST /api/upload ---
    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        
        String username = authentication.getName();
        Document newDoc = documentService.uploadAndProcessDocument(file, username); 
        
        return ResponseEntity.ok(Map.of(
            "message", "File uploaded and sent for AI processing.", 
            "documentId", newDoc.getId()
        ));
    }

    // --- POST /api/query ---
    @PostMapping("/query")
    public ResponseEntity<?> queryDocument(
            @RequestBody DocumentQueryRequest queryRequest,
            Authentication authentication) {
        
        String username = authentication.getName();
        
        String answer = documentService.queryDocument(
            queryRequest.getDocumentId(), 
            queryRequest.getQuery(), 
            username
        );
        
        return ResponseEntity.ok(Map.of("answer", answer));
    }

    public static class DocumentQueryRequest {
        private Long documentId;
        private String query;

        public Long getDocumentId() { return documentId; }
        public void setDocumentId(Long documentId) { this.documentId = documentId; }
        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
    }
}
