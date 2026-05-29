package com.texton.backend.repositories;

import com.texton.backend.models.StudyArtifact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StudyArtifactRepository extends JpaRepository<StudyArtifact, Long> {
    List<StudyArtifact> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<StudyArtifact> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, StudyArtifact.ArtifactType type);
}
