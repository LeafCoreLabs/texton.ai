package com.texton.backend.controllers;

import com.texton.backend.models.StudyArtifact;
import com.texton.backend.service.AuthService;
import com.texton.backend.service.PracticeService;
import com.texton.backend.service.StudyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study")
public class StudyController {

    private final StudyService studyService;
    private final PracticeService practiceService;
    private final AuthService authService;

    public StudyController(StudyService studyService,
                           PracticeService practiceService,
                           AuthService authService) {
        this.studyService = studyService;
        this.practiceService = practiceService;
        this.authService = authService;
    }

    @PostMapping("/{toolId}")
    public ResponseEntity<?> runTool(
            @PathVariable String toolId,
            @RequestBody StudyToolRequest request) {

        String username = authService.requireAuthenticatedUsername();
        Map<String, Object> result = studyService.runTool(
                toolId,
                request.getDocumentId(),
                request.getPackId(),
                username
        );
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        Object artifactId = result.get("artifactId");
        if (artifactId != null && "flashcards".equals(toolId)) {
            practiceService.initReviewsForArtifact(((Number) artifactId).longValue(), username);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/artifacts")
    public ResponseEntity<List<Map<String, Object>>> listArtifacts() {
        String username = authService.requireAuthenticatedUsername();
        return ResponseEntity.ok(studyService.listArtifactsSummary(username));
    }

    @GetMapping("/artifacts/{id}")
    public ResponseEntity<?> getArtifact(@PathVariable Long id) {
        String username = authService.requireAuthenticatedUsername();
        StudyArtifact a = studyService.getArtifact(id, username);
        if (a == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of(
                "id", a.getId(),
                "type", a.getType().name(),
                "title", a.getTitle(),
                "content", a.getContentJson(),
                "documentId", a.getDocumentId() != null ? a.getDocumentId() : "",
                "packId", a.getPackId() != null ? a.getPackId() : ""
        ));
    }

    @PostMapping("/reviews/rate")
    public ResponseEntity<?> rateCard(@RequestBody RateCardRequest request) {
        String username = authService.requireAuthenticatedUsername();
        try {
            var updated = practiceService.rateCard(
                    request.getArtifactId(),
                    request.getCardIndex(),
                    request.getQuality(),
                    username
            );
            return ResponseEntity.ok(Map.of(
                    "nextReviewAt", updated.getNextReviewAt().toString(),
                    "intervalDays", updated.getIntervalDays()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/reviews/due")
    public ResponseEntity<?> dueReviews() {
        String username = authService.requireAuthenticatedUsername();
        return ResponseEntity.ok(practiceService.getDueSummary(username));
    }

    @PostMapping("/revision-plan")
    public ResponseEntity<?> revisionPlan(@RequestBody RevisionPlanRequest request) {
        String username = authService.requireAuthenticatedUsername();
        Map<String, Object> result = studyService.runRevisionPlan(
                request.getExamId(),
                request.getPackId(),
                request.getDays() != null ? request.getDays() : 7,
                request.getProfileContext(),
                username
        );
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    public static class StudyToolRequest {
        private Long documentId;
        private Long packId;
        public Long getDocumentId() { return documentId; }
        public void setDocumentId(Long documentId) { this.documentId = documentId; }
        public Long getPackId() { return packId; }
        public void setPackId(Long packId) { this.packId = packId; }
    }

    public static class RateCardRequest {
        private Long artifactId;
        private int cardIndex;
        private int quality;
        public Long getArtifactId() { return artifactId; }
        public void setArtifactId(Long artifactId) { this.artifactId = artifactId; }
        public int getCardIndex() { return cardIndex; }
        public void setCardIndex(int cardIndex) { this.cardIndex = cardIndex; }
        public int getQuality() { return quality; }
        public void setQuality(int quality) { this.quality = quality; }
    }

    public static class RevisionPlanRequest {
        private Long examId;
        private Long packId;
        private Integer days;
        private String profileContext;
        public Long getExamId() { return examId; }
        public void setExamId(Long examId) { this.examId = examId; }
        public Long getPackId() { return packId; }
        public void setPackId(Long packId) { this.packId = packId; }
        public Integer getDays() { return days; }
        public void setDays(Integer days) { this.days = days; }
        public String getProfileContext() { return profileContext; }
        public void setProfileContext(String profileContext) { this.profileContext = profileContext; }
    }
}
