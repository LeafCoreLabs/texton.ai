package com.texton.backend.security;

import com.texton.backend.config.EncryptionProperties;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class AesEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final byte[] MAGIC = new byte[] {'T', 'X', 'E', 'N'};

    private final EncryptionProperties encryptionProperties;
    private SecretKey secretKey;
    private boolean enabled;

    public AesEncryptionService(EncryptionProperties encryptionProperties) {
        this.encryptionProperties = encryptionProperties;
    }

    @PostConstruct
    void init() {
        String keyMaterial = encryptionProperties.getKey();
        if (keyMaterial == null || keyMaterial.isBlank()) {
            enabled = false;
            return;
        }
        byte[] keyBytes = decodeKey(keyMaterial);
        if (keyBytes.length != 32) {
            throw new IllegalStateException("ENCRYPTION_KEY must decode to exactly 32 bytes for AES-256.");
        }
        secretKey = new SecretKeySpec(keyBytes, "AES");
        enabled = true;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public byte[] encrypt(byte[] plaintext) {
        if (!enabled) {
            return plaintext;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext);

            ByteBuffer buffer = ByteBuffer.allocate(MAGIC.length + iv.length + ciphertext.length);
            buffer.put(MAGIC);
            buffer.put(iv);
            buffer.put(ciphertext);
            return buffer.array();
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public byte[] decrypt(byte[] data) {
        if (!enabled || !isEncrypted(data)) {
            return data;
        }
        try {
            ByteBuffer buffer = ByteBuffer.wrap(data);
            buffer.position(MAGIC.length);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return cipher.doFinal(ciphertext);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    public boolean isEncrypted(byte[] data) {
        if (data == null || data.length < MAGIC.length + GCM_IV_LENGTH + 1) {
            return false;
        }
        for (int i = 0; i < MAGIC.length; i++) {
            if (data[i] != MAGIC[i]) {
                return false;
            }
        }
        return true;
    }

    private static byte[] decodeKey(String keyMaterial) {
        try {
            return Base64.getDecoder().decode(keyMaterial);
        } catch (IllegalArgumentException e) {
            return keyMaterial.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}
