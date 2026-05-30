package com.texton.backend.service;

import com.texton.backend.security.AesEncryptionService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class S3Service {

    private final AesEncryptionService encryptionService;

    public S3Service(AesEncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    public String uploadFile(MultipartFile file, Long userId) {
        try {
            String original = file.getOriginalFilename();
            String safeName = original != null
                    ? Path.of(original).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_")
                    : "upload";
            Path path = Path.of("garage-storage/" + userId + "/" + safeName);
            Files.createDirectories(path.getParent());
            byte[] payload = encryptionService.encrypt(file.getBytes());
            Files.write(path, payload);
            return path.toString();
        } catch (Exception e) {
            throw new RuntimeException("Unable to upload file", e);
        }
    }

    public byte[] downloadFile(String key) {
        try {
            byte[] stored = Files.readAllBytes(Path.of(key));
            return encryptionService.decrypt(stored);
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file", e);
        }
    }

    public void deleteFile(String key) {
        try {
            Files.deleteIfExists(Path.of(key));
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }
}
