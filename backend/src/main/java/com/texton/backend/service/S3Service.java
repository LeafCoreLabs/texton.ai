package com.texton.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class S3Service {

    public String uploadFile(MultipartFile file, Long userId) {
        try {
            Path path = Path.of("garage-storage/" + userId + "/" + file.getOriginalFilename());
            Files.createDirectories(path.getParent());
            Files.write(path, file.getBytes());
            return path.toString();
        } catch (Exception e) {
            throw new RuntimeException("Unable to upload file", e);
        }
    }

    public byte[] downloadFile(String key) {
        try {
            return Files.readAllBytes(Path.of(key));
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file", e);
        }
    }
}
