package com.texton.backend.config;

import com.texton.backend.repositories.RefreshTokenRepository;
import com.texton.backend.repositories.RevokedTokenRepository;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
public class TokenCleanupScheduler {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RevokedTokenRepository revokedTokenRepository;

    public TokenCleanupScheduler(RefreshTokenRepository refreshTokenRepository,
                                   RevokedTokenRepository revokedTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.revokedTokenRepository = revokedTokenRepository;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        Instant cutoff = Instant.now().minus(1, ChronoUnit.DAYS);
        refreshTokenRepository.deleteExpiredOrRevoked(cutoff);
        revokedTokenRepository.deleteExpired(Instant.now());
    }
}
