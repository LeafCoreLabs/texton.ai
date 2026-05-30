package com.texton.backend.controllers;

import com.texton.backend.repositories.DocumentRepository;
import com.texton.backend.repositories.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;

    public AdminController(UserRepository userRepository, DocumentRepository documentRepository) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
    }

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of(
                "users", userRepository.count(),
                "documents", documentRepository.count()
        );
    }
}
