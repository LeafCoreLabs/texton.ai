package com.texton.backend.controllers;

import com.texton.backend.config.GuestAuth;
import com.texton.backend.models.User;
import com.texton.backend.models.User.Role;
import com.texton.backend.repositories.UserRepository;
import com.texton.backend.security.SecurityAuditLogger;
import com.texton.backend.service.AuthService;
import com.texton.backend.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final AuthService authService;
    private final TokenService tokenService;
    private final SecurityAuditLogger auditLogger;

    public AuthController(UserRepository userRepository,
                          AuthenticationManager authenticationManager,
                          AuthService authService,
                          TokenService tokenService,
                          SecurityAuditLogger auditLogger) {
        this.userRepository = userRepository;
        this.authenticationManager = authenticationManager;
        this.authService = authService;
        this.tokenService = tokenService;
        this.auditLogger = auditLogger;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req, HttpServletRequest request) {
        if (req.getUsername() == null || req.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required."));
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required."));
        }
        if (req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full name is required."));
        }
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }
        if ("admin".equalsIgnoreCase(req.getRole_type())) {
            return ResponseEntity.status(403).body(Map.of("error", "Cannot sign up as admin."));
        }
        if (GuestAuth.GUEST_USERNAME.equalsIgnoreCase(req.getUsername().trim())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This username is reserved."));
        }
        if (userRepository.findByUsername(req.getUsername().trim()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken."));
        }

        User user = new User();
        user.setUsername(req.getUsername().trim());
        user.setPassword(req.getPassword());
        user.setName(req.getName().trim());
        user.setEmail(req.getEmail().trim());
        user.setContact(req.getContact() != null ? req.getContact() : "");
        user.setAddress(req.getAddress() != null ? req.getAddress() : "");
        user.setDesignation(req.getDesignation() != null ? req.getDesignation() : "Student");
        user.setRole(Role.USER);

        authService.signup(user);
        auditLogger.signup(user.getUsername(), TokenService.clientIp(request));
        return ResponseEntity.ok(Map.of("message", "Account created successfully. Please sign in."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateAndGetToken(@RequestBody LoginRequest authRequest,
                                                       HttpServletRequest request,
                                                       HttpServletResponse response) {
        String userType = authRequest.getUser_type() != null ? authRequest.getUser_type().trim() : "";
        String ip = TokenService.clientIp(request);

        if (GuestAuth.GUEST_USERNAME.equalsIgnoreCase(authRequest.getUsername())) {
            return ResponseEntity.status(403).body(Map.of("error", "Guest access does not use login. Continue without signing in."));
        }

        try {
            ResponseEntity<?> result;
            if ("user".equalsIgnoreCase(userType)) {
                result = loginAsStudent(authRequest, response);
            } else if ("admin".equalsIgnoreCase(userType)) {
                result = loginAsAdmin(authRequest, response);
            } else {
                return ResponseEntity.status(403).body(Map.of("error", "Invalid login type. Use user or admin."));
            }
            if (result.getStatusCode().is2xxSuccessful()) {
                auditLogger.loginSuccess(authRequest.getUsername(), ip);
            }
            return result;
        } catch (BadCredentialsException ex) {
            auditLogger.loginFailure(authRequest.getUsername(), ip, "invalid_credentials");
            throw ex;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        return tokenService.refreshSession(request, response)
                .map(body -> ResponseEntity.ok(body))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "Session expired. Please sign in again.")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        String username = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;
        tokenService.revokeSession(request, response, username);
        auditLogger.logout(username != null ? username : "anonymous", TokenService.clientIp(request));
        return ResponseEntity.ok(Map.of("message", "Logged out."));
    }

    private ResponseEntity<?> loginAsStudent(LoginRequest authRequest, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User realUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found in DB"));

        if (realUser.getRole() != Role.USER) {
            return ResponseEntity.status(403).body(Map.of("error", "Use admin login for administrator accounts."));
        }

        return buildLoginResponse(realUser, response);
    }

    private ResponseEntity<?> loginAsAdmin(LoginRequest authRequest, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User realUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found in DB"));

        if (realUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin credentials required."));
        }

        return buildLoginResponse(realUser, response);
    }

    private ResponseEntity<?> buildLoginResponse(User user, HttpServletResponse response) {
        tokenService.issueSession(user, response);
        String role = user.getRole() == Role.ADMIN ? "admin" : "user";
        return ResponseEntity.ok(Map.of(
                "role", role,
                "username", user.getUsername()
        ));
    }

    public static class LoginRequest {
        private String username;
        private String password;
        private String user_type;

        public String getUsername() { return username; }
        public String getPassword() { return password; }
        public String getUser_type() { return user_type; }

        public void setUsername(String username) { this.username = username; }
        public void setPassword(String password) { this.password = password; }
        public void setUser_type(String user_type) { this.user_type = user_type; }
    }

    public static class SignupRequest {
        private String username;
        private String password;
        private String name;
        private String email;
        private String contact;
        private String address;
        private String designation;
        private String role_type;

        public String getUsername() { return username; }
        public String getPassword() { return password; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getContact() { return contact; }
        public String getAddress() { return address; }
        public String getDesignation() { return designation; }
        public String getRole_type() { return role_type; }

        public void setUsername(String username) { this.username = username; }
        public void setPassword(String password) { this.password = password; }
        public void setName(String name) { this.name = name; }
        public void setEmail(String email) { this.email = email; }
        public void setContact(String contact) { this.contact = contact; }
        public void setAddress(String address) { this.address = address; }
        public void setDesignation(String designation) { this.designation = designation; }
        public void setRole_type(String role_type) { this.role_type = role_type; }
    }
}
