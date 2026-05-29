package com.texton.backend.repositories;

import com.texton.backend.models.TopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TopicProgressRepository extends JpaRepository<TopicProgress, Long> {
    List<TopicProgress> findByExamIdOrderByTopicNameAsc(Long examId);
    List<TopicProgress> findByUserIdAndExamIsNullOrderByTopicNameAsc(Long userId);
}
