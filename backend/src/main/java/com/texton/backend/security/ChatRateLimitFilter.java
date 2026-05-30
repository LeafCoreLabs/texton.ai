package com.texton.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.texton.backend.config.SecurityProperties;
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
public class ChatRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60 * 60 * 1000L;

    private final SecurityProperties securityProperties;
    private final SecurityAuditLogger auditLogger;
    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatRateLimitFilter(SecurityProperties securityProperties, SecurityAuditLogger auditLogger) {
        this.securityProperties = securityProperties;
        this.auditLogger = auditLogger;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!"POST".equalsIgnoreCase(request.getMethod()) || !"/api/chat".equals(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rateLimitKey(request);
        int limit = isAuthenticated() ? securityProperties.getAuthChatLimitPerHour()
                : securityProperties.getGuestChatLimitPerHour();

        Window window = windows.computeIfAbsent(key, k -> new Window());
        synchronized (window) {
            long now = System.currentTimeMillis();
            if (now - window.startMs > WINDOW_MS) {
                window.startMs = now;
                window.count.set(0);
            }
            if (window.count.incrementAndGet() > limit) {
                auditLogger.rateLimited("/api/chat", AuthRateLimitFilter.clientIp(request));
                response.setStatus(429);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(response.getOutputStream(),
                        Map.of("error", "Chat rate limit exceeded. Please try again later or sign in."));
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String rateLimitKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal().toString())) {
            return "user:" + auth.getName();
        }
        return "ip:" + AuthRateLimitFilter.clientIp(request);
    }

    private boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(String.valueOf(auth.getPrincipal()));
    }

    private static final class Window {
        long startMs = System.currentTimeMillis();
        final AtomicInteger count = new AtomicInteger(0);
    }
}
