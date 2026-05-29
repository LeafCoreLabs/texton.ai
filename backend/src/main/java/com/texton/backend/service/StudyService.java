package com.texton.backend.service;

import com.texton.backend.models.*;
import com.texton.backend.repositories.*;
import com.texton.backend.models.Exam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudyService {

    @Autowired
    private AuthService authService;
    @Autowired
    private DocumentRepository documentRepository;
    @Autowired
    private StudyPackRepository studyPackRepository;
    @Autowired
    private ParsingService parsingService;
    @Autowired
    private StudyArtifactRepository studyArtifactRepository;
    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private DocumentRetrievalService documentRetrievalService;

    public Map<String, Object> runTool(String toolId, Long documentId, Long packId, String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return Map.of("error", "User not found");

        List<String> contextChunks = gatherContext(documentId, packId, user);
        if (contextChunks.isEmpty()) {
            return Map.of("error", "No processed content found. Wait for documents to finish processing.");
        }

        String context = String.join("\n\n---\n\n", contextChunks);
        String result = parsingService.runStudyTool(toolId, context, null);

        StudyArtifact.ArtifactType type = mapToolType(toolId);
        if (type != null) {
            StudyArtifact artifact = new StudyArtifact();
            artifact.setUser(user);
            artifact.setType(type);
            artifact.setDocumentId(documentId);
            artifact.setPackId(packId);
            artifact.setContentJson(result != null ? result : "");
            artifact.setTitle(toolId + " – " + java.time.LocalDate.now());
            studyArtifactRepository.save(artifact);
            return Map.of(
                    "content", result,
                    "artifactId", artifact.getId(),
                    "type", type.name()
            );
        }

        return Map.of("content", result);
    }

    public Map<String, Object> runRevisionPlan(Long examId, Long packId, int days, String profileContext, String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return Map.of("error", "User not found");

        Long resolvedPackId = packId;
        Long documentId = null;
        if (examId != null) {
            Exam exam = examRepository.findById(examId).orElse(null);
            if (exam == null || !exam.getUser().getId().equals(user.getId())) {
                return Map.of("error", "Exam not found");
            }
            if (exam.getStudyPack() != null) resolvedPackId = exam.getStudyPack().getId();
        }

        List<String> contextChunks = gatherContext(documentId, resolvedPackId, user);
        if (contextChunks.isEmpty()) {
            return Map.of("error", "Link a study pack or select processed documents first.");
        }

        String context = String.join("\n\n---\n\n", contextChunks);
        String extra = "Create a " + days + "-day revision schedule in Markdown with daily goals, topics, and active recall tasks.";
        if (profileContext != null && !profileContext.isBlank()) {
            extra = profileContext + " " + extra;
        }
        String result = parsingService.runStudyTool("revision-plan", context, extra);

        StudyArtifact artifact = new StudyArtifact();
        artifact.setUser(user);
        artifact.setType(StudyArtifact.ArtifactType.REVISION_PLAN);
        artifact.setPackId(resolvedPackId);
        artifact.setContentJson(result != null ? result : "");
        artifact.setTitle("Revision plan – " + java.time.LocalDate.now());
        studyArtifactRepository.save(artifact);

        return Map.of("content", result, "artifactId", artifact.getId(), "type", "REVISION_PLAN");
    }

    private StudyArtifact.ArtifactType mapToolType(String toolId) {
        return switch (toolId) {
            case "notes" -> StudyArtifact.ArtifactType.NOTES;
            case "exam-summary" -> StudyArtifact.ArtifactType.EXAM_SUMMARY;
            case "flashcards" -> StudyArtifact.ArtifactType.FLASHCARDS;
            case "mcq-quiz" -> StudyArtifact.ArtifactType.MCQ_QUIZ;
            case "topics" -> StudyArtifact.ArtifactType.TOPICS;
            case "revision-plan" -> StudyArtifact.ArtifactType.REVISION_PLAN;
            default -> null;
        };
    }

    private List<String> gatherContext(Long documentId, Long packId, User user) {
        List<Long> docIds = new ArrayList<>();
        if (packId != null) {
            StudyPack pack = studyPackRepository.findByIdAndUserId(packId, user.getId()).orElse(null);
            if (pack == null) return List.of();
            for (StudyPackDocument pd : pack.getPackDocuments()) {
                docIds.add(pd.getDocumentId());
            }
        } else if (documentId != null) {
            docIds.add(documentId);
        } else {
            return List.of();
        }

        List<Long> processed = docIds.stream()
                .filter(id -> {
                    Document d = documentRepository.findById(id).orElse(null);
                    return d != null
                            && d.getUser().getId().equals(user.getId())
                            && d.getStatus() == Document.DocumentStatus.PROCESSED;
                })
                .collect(Collectors.toList());

        if (processed.isEmpty()) return List.of();

        String probe = "key concepts definitions explanations examples from course material";
        DocumentRetrievalService.RetrievalResult retrieval;
        if (processed.size() == 1 && documentId != null) {
            retrieval = documentRetrievalService.retrieveForDocument(processed.get(0), probe);
        } else {
            retrieval = documentRetrievalService.retrieveForStudyPack(processed, probe);
        }
        if (!retrieval.sufficientEvidence()) {
            return List.of();
        }
        return retrieval.excerpts();
    }

    public List<StudyArtifact> listArtifacts(String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return List.of();
        return studyArtifactRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public List<Map<String, Object>> listArtifactsSummary(String username) {
        return listArtifacts(username).stream()
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "type", a.getType().name(),
                        "title", a.getTitle(),
                        "documentId", a.getDocumentId() != null ? a.getDocumentId() : "",
                        "packId", a.getPackId() != null ? a.getPackId() : ""
                ))
                .toList();
    }

    public StudyArtifact getArtifact(Long id, String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return null;
        StudyArtifact a = studyArtifactRepository.findById(id).orElse(null);
        if (a == null || !a.getUser().getId().equals(user.getId())) return null;
        return a;
    }
}
