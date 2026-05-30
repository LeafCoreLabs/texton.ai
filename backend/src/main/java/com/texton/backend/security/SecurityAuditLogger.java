package com.texton.backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SecurityAuditLogger {

    private static final Logger log = LoggerFactory.getLogger("SECURITY_AUDIT");

    public void loginSuccess(String username, String ip) {
        log.info("LOGIN_SUCCESS user={} ip={}", username, ip);
    }

    public void loginFailure(String username, String ip, String reason) {
        log.warn("LOGIN_FAILURE user={} ip={} reason={}", username, ip, reason);
    }

    public void logout(String username, String ip) {
        log.info("LOGOUT user={} ip={}", username, ip);
    }

    public void tokenRefresh(String username, String ip) {
        log.info("TOKEN_REFRESH user={} ip={}", username, ip);
    }

    public void tokenRevoked(String username, String reason) {
        log.info("TOKEN_REVOKED user={} reason={}", username, reason);
    }

    public void signup(String username, String ip) {
        log.info("SIGNUP user={} ip={}", username, ip);
    }

    public void accessDenied(String username, String path, String ip) {
        log.warn("ACCESS_DENIED user={} path={} ip={}", username, path, ip);
    }

    public void rateLimited(String path, String ip) {
        log.warn("RATE_LIMITED path={} ip={}", path, ip);
    }
}
