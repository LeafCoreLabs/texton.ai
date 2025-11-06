package com.texton.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;

/**
 * Apache Tika Server client. In REAL mode we send the file to Tika to get plain text.
 */
@Service
public class TikaClient {

    @Value("${services.apache-tika.url:http://localhost:9998}")
    private String tikaUrl;

    private final RestTemplate http = new RestTemplate();

    public String extractPlainText(MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.valueOf(Objects.requireNonNull(file.getContentType(), "application/octet-stream")));

            HttpEntity<byte[]> req = new HttpEntity<>(file.getBytes(), headers);
            ResponseEntity<String> resp = http.postForEntity(
                    tikaUrl + "/tika", req, String.class
            );
            return resp.getBody() == null ? "" : resp.getBody();
        } catch (Exception e) {
            return ""; // fail soft
        }
    }
}
