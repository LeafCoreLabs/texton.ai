package com.texton.backend.service;

import com.texton.backend.models.*;
import com.texton.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PackService {

    @Autowired
    private AuthService authService;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private StudyPackRepository studyPackRepository;
    @Autowired
    private ExamRepository examRepository;
    @Autowired
    private TopicProgressRepository topicProgressRepository;
    @Autowired
    private DocumentRepository documentRepository;
    @Autowired
    private StudyService studyService;

    public List<Subject> listSubjects(String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return List.of();
        return subjectRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public Subject createSubject(String name, String color, String username) {
        User user = authService.getUserByUsername(username);
        Subject s = new Subject();
        s.setUser(user);
        s.setName(name);
        s.setColor(color != null ? color : "#6366f1");
        return subjectRepository.save(s);
    }

    public List<StudyPack> listPacks(String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return List.of();
        return studyPackRepository.findByUserIdWithDocuments(user.getId());
    }

    @Transactional
    public StudyPack createPack(String name, Long subjectId, List<Long> documentIds, String username) {
        User user = authService.getUserByUsername(username);
        verifyDocumentOwnership(documentIds, user.getId());
        StudyPack pack = new StudyPack();
        pack.setUser(user);
        pack.setName(name);
        if (subjectId != null) {
            subjectRepository.findById(subjectId).ifPresent(pack::setSubject);
        }
        if (documentIds != null) {
            for (Long docId : documentIds) {
                StudyPackDocument pd = new StudyPackDocument();
                pd.setStudyPack(pack);
                pd.setDocumentId(docId);
                pack.getPackDocuments().add(pd);
            }
        }
        return studyPackRepository.save(pack);
    }

    @Transactional
    public StudyPack updatePackDocuments(Long packId, List<Long> documentIds, String username) {
        User user = authService.getUserByUsername(username);
        verifyDocumentOwnership(documentIds, user.getId());
        StudyPack pack = studyPackRepository.findByIdAndUserId(packId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Pack not found"));
        pack.getPackDocuments().clear();
        for (Long docId : documentIds) {
            StudyPackDocument pd = new StudyPackDocument();
            pd.setStudyPack(pack);
            pd.setDocumentId(docId);
            pack.getPackDocuments().add(pd);
        }
        return studyPackRepository.save(pack);
    }

    @Transactional
    public void deletePack(Long packId, String username) {
        User user = authService.getUserByUsername(username);
        StudyPack pack = studyPackRepository.findByIdAndUserId(packId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Pack not found"));
        studyPackRepository.delete(pack);
    }

    public List<Exam> listExams(String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return List.of();
        return examRepository.findByUserIdOrderByExamDateAscCreatedAtDesc(user.getId());
    }

    public Exam createExam(String title, LocalDate examDate, Long subjectId, Long packId, String syllabusNotes, String username) {
        User user = authService.getUserByUsername(username);
        Exam exam = new Exam();
        exam.setUser(user);
        exam.setTitle(title);
        exam.setExamDate(examDate);
        exam.setSyllabusNotes(syllabusNotes);
        if (subjectId != null) {
            subjectRepository.findById(subjectId).ifPresent(exam::setSubject);
        }
        if (packId != null) {
            studyPackRepository.findByIdAndUserId(packId, user.getId()).ifPresent(exam::setStudyPack);
        }
        return examRepository.save(exam);
    }

    public List<TopicProgress> listTopics(Long examId, String username) {
        User user = authService.getUserByUsername(username);
        if (examId != null) {
            Exam exam = examRepository.findById(examId)
                    .orElseThrow(() -> new IllegalArgumentException("Exam not found"));
            if (!exam.getUser().getId().equals(user.getId())) {
                throw new IllegalArgumentException("Forbidden");
            }
            return topicProgressRepository.findByExamIdOrderByTopicNameAsc(examId);
        }
        return topicProgressRepository.findByUserIdAndExamIsNullOrderByTopicNameAsc(user.getId());
    }

    public TopicProgress updateTopicStatus(Long topicId, TopicProgress.TopicStatus status, String username) {
        TopicProgress t = topicProgressRepository.findById(topicId).orElseThrow();
        User user = authService.getUserByUsername(username);
        if (!t.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Forbidden");
        }
        t.setStatus(status);
        return topicProgressRepository.save(t);
    }

    /** Extract topics from exam syllabus via study tool on first linked doc or general prompt */
    @Transactional
    public List<TopicProgress> generateTopicsForExam(Long examId, Long documentId, Long packIdParam, String username) {
        User user = authService.getUserByUsername(username);
        Exam exam = examRepository.findById(examId).orElseThrow();
        if (!exam.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Forbidden");
        }

        Long packId = packIdParam != null ? packIdParam
                : (exam.getStudyPack() != null ? exam.getStudyPack().getId() : null);
        Map<String, Object> result = studyService.runTool("topics", documentId, packId, username);
        String content = (String) result.get("content");
        List<String> topics = parseTopicList(content);

        List<TopicProgress> saved = new ArrayList<>();
        for (String topic : topics) {
            TopicProgress tp = new TopicProgress();
            tp.setUser(user);
            tp.setExam(exam);
            tp.setTopicName(topic);
            tp.setStatus(TopicProgress.TopicStatus.PENDING);
            saved.add(topicProgressRepository.save(tp));
        }
        return saved;
    }

    private List<String> parseTopicList(String content) {
        List<String> topics = new ArrayList<>();
        if (content == null) return topics;
        String trimmed = content.trim();
        if (trimmed.startsWith("[")) {
            trimmed = trimmed.replaceAll("[\\[\\]\"]", " ");
            for (String part : trimmed.split(",")) {
                String t = part.trim();
                if (!t.isEmpty()) topics.add(t);
            }
        } else {
            for (String line : content.split("\n")) {
                String t = line.replaceAll("^[-*\\d.\\s]+", "").trim();
                if (!t.isEmpty() && t.length() < 120) topics.add(t);
            }
        }
        return topics.stream().limit(25).toList();
    }

    private void verifyDocumentOwnership(List<Long> documentIds, Long userId) {
        if (documentIds == null) return;
        for (Long docId : documentIds) {
            Document doc = documentRepository.findById(docId)
                    .orElseThrow(() -> new IllegalArgumentException("Document not found: " + docId));
            if (!doc.getUser().getId().equals(userId)) {
                throw new IllegalArgumentException("Document not owned by user: " + docId);
            }
        }
    }
}
