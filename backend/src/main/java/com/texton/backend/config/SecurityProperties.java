package com.texton.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "texton.security")
public class SecurityProperties {

    public static final String AUTH_COOKIE_NAME = "texton_token";

    private List<String> corsOrigins = new ArrayList<>(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173"
    ));

    private boolean cookieSecure = false;

    /** Access token cookie lifetime (seconds). Default 15 minutes. */
    private long accessTokenMaxAgeSeconds = 900;

    /** Refresh token cookie lifetime (seconds). Default 7 days. */
    private long refreshTokenMaxAgeSeconds = 604800;

    /** Anonymous chat requests per IP per hour. */
    private int guestChatLimitPerHour = 30;

    /** Authenticated chat requests per user per hour. */
    private int authChatLimitPerHour = 200;

    public List<String> getCorsOrigins() {
        return corsOrigins;
    }

    public void setCorsOrigins(List<String> corsOrigins) {
        this.corsOrigins = corsOrigins;
    }

    public boolean isCookieSecure() {
        return cookieSecure;
    }

    public void setCookieSecure(boolean cookieSecure) {
        this.cookieSecure = cookieSecure;
    }

    public long getAccessTokenMaxAgeSeconds() {
        return accessTokenMaxAgeSeconds;
    }

    public void setAccessTokenMaxAgeSeconds(long accessTokenMaxAgeSeconds) {
        this.accessTokenMaxAgeSeconds = accessTokenMaxAgeSeconds;
    }

    public long getRefreshTokenMaxAgeSeconds() {
        return refreshTokenMaxAgeSeconds;
    }

    public void setRefreshTokenMaxAgeSeconds(long refreshTokenMaxAgeSeconds) {
        this.refreshTokenMaxAgeSeconds = refreshTokenMaxAgeSeconds;
    }

    public int getGuestChatLimitPerHour() {
        return guestChatLimitPerHour;
    }

    public void setGuestChatLimitPerHour(int guestChatLimitPerHour) {
        this.guestChatLimitPerHour = guestChatLimitPerHour;
    }

    public int getAuthChatLimitPerHour() {
        return authChatLimitPerHour;
    }

    public void setAuthChatLimitPerHour(int authChatLimitPerHour) {
        this.authChatLimitPerHour = authChatLimitPerHour;
    }

    /** @deprecated Use accessTokenMaxAgeSeconds */
    @Deprecated
    public long getCookieMaxAgeSeconds() {
        return accessTokenMaxAgeSeconds;
    }

    /** @deprecated Use accessTokenMaxAgeSeconds */
    @Deprecated
    public void setCookieMaxAgeSeconds(long cookieMaxAgeSeconds) {
        this.accessTokenMaxAgeSeconds = cookieMaxAgeSeconds;
    }
}
