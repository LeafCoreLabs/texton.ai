package com.texton.backend.repositories;

import com.texton.backend.models.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByUserIdOrderByExamDateAscCreatedAtDesc(Long userId);
}
