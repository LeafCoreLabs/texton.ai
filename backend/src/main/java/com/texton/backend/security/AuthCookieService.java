package com.texton.backend.security;

import com.texton.backend.config.SecurityProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class AuthCookieService {

    public static final String REFRESH_COOKIE_NAME = "texton_refresh";

    private final SecurityProperties securityProperties;

    public AuthCookieService(SecurityProperties securityProperties) {
        this.securityProperties = securityProperties;
    }

    public void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        response.addHeader("Set-Cookie", buildCookie(SecurityProperties.AUTH_COOKIE_NAME, accessToken,
                securityProperties.getAccessTokenMaxAgeSeconds()).toString());
        response.addHeader("Set-Cookie", buildCookie(REFRESH_COOKIE_NAME, refreshToken,
                securityProperties.getRefreshTokenMaxAgeSeconds()).toString());
    }

    public void clearAllAuthCookies(HttpServletResponse response) {
        response.addHeader("Set-Cookie", buildCookie(SecurityProperties.AUTH_COOKIE_NAME, "", 0).toString());
        response.addHeader("Set-Cookie", buildCookie(REFRESH_COOKIE_NAME, "", 0).toString());
    }

    public static String readRefreshCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (REFRESH_COOKIE_NAME.equals(cookie.getName())
                    && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(securityProperties.isCookieSecure())
                .sameSite("Strict")
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }
}
