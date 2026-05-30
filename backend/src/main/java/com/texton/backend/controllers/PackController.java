package com.texton.backend.controllers;

import com.texton.backend.models.*;
import com.texton.backend.service.AuthService;
import com.texton.backend.service.PackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PackController {

    private final PackService packService;
    private final AuthService authService;

    public PackController(PackService packService, AuthService authService) {
        this.packService = packService;
        this.authService = authService;
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> listSubjects() {
        return ResponseEntity.ok(packService.listSubjects(authService.resolveGuestOrUser()));
    }

    @PostMapping("/subjects")
    public ResponseEntity<Subject> createSubject(@RequestBody SubjectRequest req) {
        return ResponseEntity.ok(packService.createSubject(
                req.getName(), req.getColor(), authService.requireAuthenticatedUsername()));
    }

    @GetMapping("/packs")
    public ResponseEntity<List<StudyPack>> listPacks() {
        return ResponseEntity.ok(packService.listPacks(authService.resolveGuestOrUser()));
    }

    @PostMapping("/packs")
    public ResponseEntity<StudyPack> createPack(@RequestBody PackRequest req) {
        return ResponseEntity.ok(packService.createPack(
                req.getName(), req.getSubjectId(), req.getDocumentIds(),
                authService.requireAuthenticatedUsername()));
    }

    @PutMapping("/packs/{packId}/documents")
    public ResponseEntity<StudyPack> updatePackDocuments(
            @PathVariable Long packId,
            @RequestBody PackRequest req) {
        return ResponseEntity.ok(packService.updatePackDocuments(
                packId, req.getDocumentIds(), authService.requireAuthenticatedUsername()));
    }

    @DeleteMapping("/packs/{packId}")
    public ResponseEntity<?> deletePack(@PathVariable Long packId) {
        packService.deletePack(packId, authService.requireAuthenticatedUsername());
        return ResponseEntity.ok(Map.of("message", "Pack deleted"));
    }

    @GetMapping("/exams")
    public ResponseEntity<List<Exam>> listExams() {
        return ResponseEntity.ok(packService.listExams(authService.resolveGuestOrUser()));
    }

    @PostMapping("/exams")
    public ResponseEntity<Exam> createExam(@RequestBody ExamRequest req) {
        LocalDate date = req.getExamDate() != null ? LocalDate.parse(req.getExamDate()) : null;
        return ResponseEntity.ok(packService.createExam(
                req.getTitle(), date, req.getSubjectId(), req.getPackId(), req.getSyllabusNotes(),
                authService.requireAuthenticatedUsername()));
    }

    @GetMapping("/exams/{examId}/topics")
    public ResponseEntity<List<TopicProgress>> listTopics(@PathVariable Long examId) {
        return ResponseEntity.ok(packService.listTopics(examId, authService.requireAuthenticatedUsername()));
    }

    @PostMapping("/exams/{examId}/topics/generate")
    public ResponseEntity<List<TopicProgress>> generateTopics(
            @PathVariable Long examId,
            @RequestBody Map<String, Long> body) {
        Long documentId = body != null ? body.get("documentId") : null;
        Long packId = body != null ? body.get("packId") : null;
        return ResponseEntity.ok(packService.generateTopicsForExam(
                examId, documentId, packId, authService.requireAuthenticatedUsername()));
    }

    @PatchMapping("/topics/{topicId}")
    public ResponseEntity<TopicProgress> updateTopic(
            @PathVariable Long topicId,
            @RequestBody Map<String, String> body) {
        TopicProgress.TopicStatus status = TopicProgress.TopicStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(packService.updateTopicStatus(
                topicId, status, authService.requireAuthenticatedUsername()));
    }

    public static class SubjectRequest {
        private String name;
        private String color;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    public static class PackRequest {
        private String name;
        private Long subjectId;
        private List<Long> documentIds;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public Long getSubjectId() { return subjectId; }
        public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
        public List<Long> getDocumentIds() { return documentIds; }
        public void setDocumentIds(List<Long> documentIds) { this.documentIds = documentIds; }
    }

    public static class ExamRequest {
        private String title;
        private String examDate;
        private Long subjectId;
        private String syllabusNotes;
        private Long packId;
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getExamDate() { return examDate; }
        public void setExamDate(String examDate) { this.examDate = examDate; }
        public Long getSubjectId() { return subjectId; }
        public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
        public String getSyllabusNotes() { return syllabusNotes; }
        public void setSyllabusNotes(String syllabusNotes) { this.syllabusNotes = syllabusNotes; }
        public Long getPackId() { return packId; }
        public void setPackId(Long packId) { this.packId = packId; }
    }
}
