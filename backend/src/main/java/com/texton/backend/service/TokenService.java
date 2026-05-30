package com.texton.backend.service;

import com.texton.backend.config.SecurityProperties;
import com.texton.backend.models.RefreshToken;
import com.texton.backend.models.RevokedToken;
import com.texton.backend.models.User;
import com.texton.backend.repositories.RefreshTokenRepository;
import com.texton.backend.repositories.RevokedTokenRepository;
import com.texton.backend.repositories.UserRepository;
import com.texton.backend.security.AuthCookieService;
import com.texton.backend.security.JwtAuthFilter;
import com.texton.backend.security.SecurityAuditLogger;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

@Service
public class TokenService {

    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final UserRepository userRepository;
    private final AuthCookieService authCookieService;
    private final SecurityAuditLogger auditLogger;
    private final long refreshExpirationDays;

    public TokenService(JwtService jwtService,
                        RefreshTokenRepository refreshTokenRepository,
                        RevokedTokenRepository revokedTokenRepository,
                        UserRepository userRepository,
                        AuthCookieService authCookieService,
                        SecurityAuditLogger auditLogger,
                        @Value("${application.security.jwt.refresh-expiration-days:7}") long refreshExpirationDays) {
        this.jwtService = jwtService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.revokedTokenRepository = revokedTokenRepository;
        this.userRepository = userRepository;
        this.authCookieService = authCookieService;
        this.auditLogger = auditLogger;
        this.refreshExpirationDays = refreshExpirationDays;
    }

    @Transactional
    public void issueSession(User user, HttpServletResponse response) {
        String role = user.getRole().name().toLowerCase();
        JwtService.TokenPair pair = jwtService.generateAccessToken(user.getUsername(), role);
        String refreshRaw = createRefreshToken(user.getId());
        authCookieService.setAuthCookies(response, pair.token(), refreshRaw);
    }

    @Transactional
    public Optional<Map<String, String>> refreshSession(HttpServletRequest request, HttpServletResponse response) {
        String refreshRaw = AuthCookieService.readRefreshCookie(request);
        if (refreshRaw == null) {
            return Optional.empty();
        }
        String hash = hashToken(refreshRaw);
        Optional<RefreshToken> stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash);
        if (stored.isEmpty() || stored.get().getExpiresAt().isBefore(Instant.now())) {
            authCookieService.clearAllAuthCookies(response);
            return Optional.empty();
        }

        RefreshToken token = stored.get();
        token.setRevoked(true);
        refreshTokenRepository.save(token);

        User user = userRepository.findById(token.getUserId()).orElse(null);
        if (user == null) {
            authCookieService.clearAllAuthCookies(response);
            return Optional.empty();
        }

        String role = user.getRole().name().toLowerCase();
        JwtService.TokenPair pair = jwtService.generateAccessToken(user.getUsername(), role);
        String newRefreshRaw = createRefreshToken(user.getId());
        authCookieService.setAuthCookies(response, pair.token(), newRefreshRaw);

        auditLogger.tokenRefresh(user.getUsername(), clientIp(request));
        return Optional.of(Map.of(
                "role", role,
                "username", user.getUsername()
        ));
    }

    @Transactional
    public void revokeSession(HttpServletRequest request, HttpServletResponse response, String username) {
        revokeAccessTokenIfPresent(request);
        String refreshRaw = AuthCookieService.readRefreshCookie(request);
        if (refreshRaw != null) {
            refreshTokenRepository.findByTokenHashAndRevokedFalse(hashToken(refreshRaw))
                    .ifPresent(token -> {
                        token.setRevoked(true);
                        refreshTokenRepository.save(token);
                    });
        }
        if (username != null) {
            User user = userRepository.findByUsername(username).orElse(null);
            if (user != null) {
                refreshTokenRepository.revokeAllByUserId(user.getId());
            }
            auditLogger.tokenRevoked(username, "logout");
        }
        authCookieService.clearAllAuthCookies(response);
    }

    public boolean isAccessTokenRevoked(String jti) {
        if (jti == null) return false;
        return revokedTokenRepository.existsById(jti);
    }

    private void revokeAccessTokenIfPresent(HttpServletRequest request) {
        String access = JwtAuthFilter.extractToken(request);
        if (access == null) return;
        try {
            String jti = jwtService.extractJti(access);
            Instant expiry = jwtService.extractExpiration(access);
            if (jti != null && expiry != null && expiry.isAfter(Instant.now())) {
                revokedTokenRepository.save(new RevokedToken(jti, expiry));
            }
        } catch (Exception ignored) {
            /* token already invalid */
        }
    }

    private String createRefreshToken(Long userId) {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken entity = new RefreshToken();
        entity.setUserId(userId);
        entity.setTokenHash(hashToken(raw));
        entity.setExpiresAt(Instant.now().plusSeconds(refreshExpirationDays * 86400L));
        refreshTokenRepository.save(entity);
        return raw;
    }

    static String hashToken(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    public static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
