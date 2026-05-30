package com.texton.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_LOGIN_ATTEMPTS = 10;
    private static final int MAX_SIGNUP_ATTEMPTS = 5;
    private static final long WINDOW_MS = 15 * 60 * 1000L;

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final SecurityAuditLogger auditLogger;

    public AuthRateLimitFilter(SecurityAuditLogger auditLogger) {
        this.auditLogger = auditLogger;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String uri = request.getRequestURI();
        Integer limit = null;
        if ("/auth/login".equals(uri)) {
            limit = MAX_LOGIN_ATTEMPTS;
        } else if ("/auth/signup".equals(uri)) {
            limit = MAX_SIGNUP_ATTEMPTS;
        }

        if (limit != null && isRateLimited(request, uri, limit)) {
            auditLogger.rateLimited(uri, clientIp(request));
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(),
                    Map.of("error", "Too many attempts. Try again later."));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(HttpServletRequest request, String uri, int limit) {
        String key = uri + ":" + clientIp(request);
        Window window = windows.computeIfAbsent(key, k -> new Window());
        synchronized (window) {
            long now = System.currentTimeMillis();
            if (now - window.startMs > WINDOW_MS) {
                window.startMs = now;
                window.count.set(0);
            }
            return window.count.incrementAndGet() > limit;
        }
    }

    static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static final class Window {
        long startMs = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(0);
    }
}
