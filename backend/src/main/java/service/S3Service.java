package com.texton.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class S3Service {
    // This mocks the S3 file upload
    public String uploadFile(MultipartFile file, Long userId) {
        System.out.println("S3 Mock: Uploading file: " + file.getOriginalFilename() + " for user " + userId);
        return "s3/" + userId + "/" + file.getOriginalFilename(); // Mock key
    }
}
