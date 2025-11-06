package com.texton.backend.repositories;

import com.texton.backend.models.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    // Fetches documents for the logged-in user, ordered newest first
    List<Document> findByUserIdOrderByUploadDateDesc(Long userId);
}
