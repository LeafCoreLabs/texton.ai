package com.texton.backend.controllers;

import com.texton.backend.models.Document;
import com.texton.backend.service.DocumentService;
import com.texton.backend.service.AuthService;
import com.texton.backend.repositories.DocumentRepository;
import com.texton.backend.util.DocumentFileValidator;
import com.texton.backend.websocket.DocumentStatusSse;

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

    private final DocumentService documentService;
    private final DocumentStatusSse documentStatusSse;
    private final AuthService authService;
    private final DocumentRepository documentRepository;

    public DocumentController(DocumentService documentService,
                              DocumentStatusSse documentStatusSse,
                              AuthService authService,
                              DocumentRepository documentRepository) {
        this.documentService = documentService;
        this.documentStatusSse = documentStatusSse;
        this.authService = authService;
        this.documentRepository = documentRepository;
    }

    @GetMapping("/documents")
    public ResponseEntity<List<Document>> getAllUserDocuments() {
        String username = authService.requireAuthenticatedUsername();
        var user = authService.getUserByUsername(username);
        if (user == null) {
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok(documentService.getDocumentsByUserId(user.getId()));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(@RequestParam("file") MultipartFile file) {
        String validationError = DocumentFileValidator.validate(file);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationError));
        }

        String username = authService.requireAuthenticatedUsername();
        Document newDoc = documentService.uploadAndProcessDocument(file, username);

        return ResponseEntity.ok(Map.of(
                "message", "File uploaded and sent for AI processing.",
                "documentId", newDoc.getId()
        ));
    }

    @PostMapping("/query")
    public ResponseEntity<?> queryDocument(@RequestBody DocumentQueryRequest queryRequest) {
        String username = authService.requireAuthenticatedUsername();
        String answer = documentService.queryDocument(
                queryRequest.getDocumentId(),
                queryRequest.getQuery(),
                username,
                queryRequest.getProfileContext()
        );

        return ResponseEntity.ok(Map.of("answer", answer));
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long documentId) {
        String username = authService.requireAuthenticatedUsername();
        String error = documentService.deleteDocument(documentId, username);

        if ("NOT_FOUND".equals(error)) {
            return ResponseEntity.status(404).body(Map.of("message", "Document not found."));
        }
        if ("FORBIDDEN".equals(error)) {
            return ResponseEntity.status(403).body(Map.of("message", "Not allowed to delete this document."));
        }

        return ResponseEntity.ok(Map.of("message", "Document deleted successfully."));
    }

    @PostMapping("/chat")
    public ResponseEntity<?> generalChat(@RequestBody GeneralChatRequest chatRequest) {
        if (chatRequest.getQuery() == null || chatRequest.getQuery().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query is required"));
        }
        String answer = documentService.generalChat(
                chatRequest.getQuery(),
                chatRequest.getHistory(),
                chatRequest.getProfileContext()
        );
        return ResponseEntity.ok(Map.of("answer", answer));
    }

    @GetMapping("/documents/{documentId}/pages/{page}")
    public ResponseEntity<?> getPageExcerpts(@PathVariable Long documentId, @PathVariable int page) {
        String username = authService.requireAuthenticatedUsername();
        Map<String, Object> body = documentService.getPageExcerpts(documentId, page, username);
        if (body.containsKey("error")) {
            String err = (String) body.get("error");
            if ("NOT_FOUND".equals(err)) return ResponseEntity.notFound().build();
            if ("FORBIDDEN".equals(err)) return ResponseEntity.status(403).body(body);
            return ResponseEntity.badRequest().body(body);
        }
        return ResponseEntity.ok(body);
    }

    @GetMapping(path = "/documents/{documentId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamDocumentStatus(@PathVariable Long documentId) {
        String username = authService.requireAuthenticatedUsername();
        Document doc = documentRepository.findById(documentId).orElse(null);

        if (doc == null || !doc.getUser().getUsername().equals(username)) {
            SseEmitter denied = new SseEmitter(0L);
            denied.complete();
            return denied;
        }

        return documentStatusSse.subscribe(documentId);
    }

    public static class DocumentQueryRequest {
        private Long documentId;
        private String query;
        private String profileContext;

        public Long getDocumentId() { return documentId; }
        public void setDocumentId(Long documentId) { this.documentId = documentId; }

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }

        public String getProfileContext() { return profileContext; }
        public void setProfileContext(String profileContext) { this.profileContext = profileContext; }
    }

    public static class GeneralChatRequest {
        private String query;
        private List<Map<String, String>> history;
        private String profileContext;

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }

        public List<Map<String, String>> getHistory() { return history; }
        public void setHistory(List<Map<String, String>> history) { this.history = history; }

        public String getProfileContext() { return profileContext; }
        public void setProfileContext(String profileContext) { this.profileContext = profileContext; }
    }
}
