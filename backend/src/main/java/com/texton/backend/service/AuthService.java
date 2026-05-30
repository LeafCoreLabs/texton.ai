package com.texton.backend.service;

import com.texton.backend.config.GuestAuth;
import com.texton.backend.models.User;
import com.texton.backend.repositories.UserRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public String login(String username, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );
        User user = userRepository.findByUsername(username).orElseThrow();
        String role = user.getRole().name().toLowerCase();
        return jwtService.generateAccessToken(username, role).token();
    }

    public User signup(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public String getUsernameFromToken(String token) {
        try {
            if (token == null) return null;
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            return jwtService.extractUsername(token);
        } catch (Exception e) {
            return null;
        }
    }

    /** Authenticated user from SecurityContext; throws 401 if absent. */
    public String requireAuthenticatedUsername() {
        String username = currentUsername();
        if (username == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Authentication required.");
        }
        return username;
    }

    /** JWT user when present; otherwise shared guest account (guest-readable routes only). */
    public String resolveGuestOrUser() {
        String username = currentUsername();
        if (username != null && !username.isBlank()) {
            return username;
        }
        return GuestAuth.GUEST_USERNAME;
    }

    /** @deprecated Use requireAuthenticatedUsername() or resolveGuestOrUser() explicitly. */
    @Deprecated
    public String resolveUsername(String authorizationHeader) {
        String fromContext = currentUsername();
        if (fromContext != null) {
            return fromContext;
        }
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            String username = getUsernameFromToken(authorizationHeader.trim());
            if (username != null && !username.isBlank()) {
                return username;
            }
        }
        return GuestAuth.GUEST_USERNAME;
    }

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return auth.getName();
    }
}
