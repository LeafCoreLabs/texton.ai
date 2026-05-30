package com.texton.backend.config;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

@Configuration
@Profile("prod")
public class ProdSecurityValidator {

    private final Environment environment;

    public ProdSecurityValidator(Environment environment) {
        this.environment = environment;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validateSecrets() {
        requireStrong("JWT_SECRET", 32);
        requirePresent("ENCRYPTION_KEY");
        requirePresent("SUPERUSER_PASSWORD");
        requirePresent("POSTGRES_PASSWORD");
        rejectWeakDefault("SUPERUSER_PASSWORD", "admin123", "change-me");
    }

    private void requirePresent(String key) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Production requires " + key + " to be set.");
        }
    }

    private void requireStrong(String key, int minLength) {
        String value = environment.getProperty(key);
        if (value == null || value.length() < minLength) {
            throw new IllegalStateException(
                    "Production requires " + key + " with at least " + minLength + " characters.");
        }
        if (value.contains("change-this") || value.contains("your-jwt")) {
            throw new IllegalStateException("Production " + key + " must not use default placeholder values.");
        }
    }

    private void rejectWeakDefault(String key, String... forbidden) {
        String value = environment.getProperty(key);
        if (value == null) return;
        for (String f : forbidden) {
            if (value.equals(f)) {
                throw new IllegalStateException("Production " + key + " must not use default value: " + f);
            }
        }
    }
}
