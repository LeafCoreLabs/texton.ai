package com.texton.backend.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "study_pack_documents")
public class StudyPackDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pack_id", nullable = false)
    @JsonIgnore
    private StudyPack studyPack;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public StudyPack getStudyPack() { return studyPack; }
    public void setStudyPack(StudyPack studyPack) { this.studyPack = studyPack; }
    public Long getDocumentId() { return documentId; }
    public void setDocumentId(Long documentId) { this.documentId = documentId; }
}
