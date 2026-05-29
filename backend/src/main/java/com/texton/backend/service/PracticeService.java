package com.texton.backend.service;

import com.texton.backend.models.CardReview;
import com.texton.backend.models.StudyArtifact;
import com.texton.backend.models.User;
import com.texton.backend.repositories.CardReviewRepository;
import com.texton.backend.repositories.StudyArtifactRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PracticeService {

    @Autowired
    private AuthService authService;
    @Autowired
    private StudyArtifactRepository studyArtifactRepository;
    @Autowired
    private CardReviewRepository cardReviewRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    @Transactional
    public void initReviewsForArtifact(Long artifactId, String username) {
        User user = authService.getUserByUsername(username);
        StudyArtifact artifact = studyArtifactRepository.findById(artifactId).orElse(null);
        if (artifact == null || !artifact.getUser().getId().equals(user.getId())) return;
        if (artifact.getType() != StudyArtifact.ArtifactType.FLASHCARDS) return;

        int count = countFlashcards(artifact.getContentJson());
        for (int i = 0; i < count; i++) {
            if (cardReviewRepository.findByUserIdAndArtifactIdAndCardIndex(user.getId(), artifactId, i).isEmpty()) {
                CardReview cr = new CardReview();
                cr.setUser(user);
                cr.setArtifact(artifact);
                cr.setCardIndex(i);
                cr.setNextReviewAt(LocalDateTime.now());
                cardReviewRepository.save(cr);
            }
        }
    }

    public List<CardReview> getDueReviews(String username) {
        User user = authService.getUserByUsername(username);
        if (user == null) return List.of();
        return cardReviewRepository.findByUserIdAndNextReviewAtBeforeOrderByNextReviewAtAsc(
                user.getId(), LocalDateTime.now().plusDays(1));
    }

    /** SM-2 style update: quality 0-5 */
    @Transactional
    public CardReview rateCard(Long artifactId, int cardIndex, int quality, String username) {
        User user = authService.getUserByUsername(username);
        CardReview cr = cardReviewRepository
                .findByUserIdAndArtifactIdAndCardIndex(user.getId(), artifactId, cardIndex)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        if (quality < 3) {
            cr.setRepetitions(0);
            cr.setIntervalDays(1);
        } else {
            cr.setRepetitions(cr.getRepetitions() + 1);
            if (cr.getRepetitions() == 1) {
                cr.setIntervalDays(1);
            } else if (cr.getRepetitions() == 2) {
                cr.setIntervalDays(6);
            } else {
                cr.setIntervalDays((int) Math.round(cr.getIntervalDays() * cr.getEaseFactor()));
            }
            cr.setEaseFactor(Math.max(1.3, cr.getEaseFactor() + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))));
        }
        cr.setNextReviewAt(LocalDateTime.now().plusDays(cr.getIntervalDays()));
        return cardReviewRepository.save(cr);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDueSummary(String username) {
        List<CardReview> due = getDueReviews(username);
        Map<Long, Map<String, Object>> grouped = new LinkedHashMap<>();
        for (CardReview cr : due) {
            StudyArtifact art = cr.getArtifact();
            Long aid = art.getId();
            grouped.computeIfAbsent(aid, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("artifactId", aid);
                m.put("title", art.getTitle());
                m.put("count", 0);
                return m;
            });
            Map<String, Object> m = grouped.get(aid);
            m.put("count", ((Integer) m.get("count")) + 1);
        }
        return new ArrayList<>(grouped.values());
    }

    public int getStudyStreakDays(String username) {
        return 1;
    }

    private int countFlashcards(String contentJson) {
        try {
            String raw = contentJson;
            if (raw.startsWith("\"")) {
                raw = mapper.readValue(raw, String.class);
            }
            JsonNode arr = mapper.readTree(raw);
            if (arr.isArray()) return arr.size();
        } catch (Exception ignored) {}
        return 10;
    }
}
