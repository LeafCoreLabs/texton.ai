package com.texton.backend.repositories;

import com.texton.backend.models.CardReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CardReviewRepository extends JpaRepository<CardReview, Long> {
    List<CardReview> findByUserIdAndNextReviewAtBeforeOrderByNextReviewAtAsc(Long userId, LocalDateTime before);
    Optional<CardReview> findByUserIdAndArtifactIdAndCardIndex(Long userId, Long artifactId, int cardIndex);
    List<CardReview> findByArtifactId(Long artifactId);
}
