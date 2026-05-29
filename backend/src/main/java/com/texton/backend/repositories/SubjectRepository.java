package com.texton.backend.repositories;

import com.texton.backend.models.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByUserIdOrderByCreatedAtDesc(Long userId);
}
