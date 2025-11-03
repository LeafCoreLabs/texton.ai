package com.texton.backend.service;

import org.springframework.stereotype.Service;

@Service
public class ParsingService {
    // This mocks the Tika REST/AI step
    public void startProcessing(Long documentId) {
        System.out.println("Parsing Mock: Starting Tika/AI/ChromaDB processing for Document ID: " + documentId);
    }
}
