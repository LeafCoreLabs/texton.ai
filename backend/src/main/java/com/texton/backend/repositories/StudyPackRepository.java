package com.texton.backend.repositories;

import com.texton.backend.models.StudyPack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface StudyPackRepository extends JpaRepository<StudyPack, Long> {
    List<StudyPack> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT DISTINCT p FROM StudyPack p LEFT JOIN FETCH p.packDocuments WHERE p.user.id = :userId ORDER BY p.createdAt DESC")
    List<StudyPack> findByUserIdWithDocuments(Long userId);

    Optional<StudyPack> findByIdAndUserId(Long id, Long userId);
}
