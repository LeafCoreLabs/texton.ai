package com.texton.backend.controller;

import com.texton.backend.models.User;
import com.texton.backend.models.User.Role;
import com.texton.backend.repositories.UserRepository;
import com.texton.backend.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private AuthenticationManager authenticationManager;

    // --- POST /auth/signup ---
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User signupRequest) {
        if (userRepository.findByUsername(signupRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is already taken."));
        }

        User user = new User();
        user.setUsername(signupRequest.getUsername());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        user.setName(signupRequest.getName());
        user.setEmail(signupRequest.getEmail());
        user.setContact(signupRequest.getContact());
        user.setAddress(signupRequest.getAddress());
        user.setDesignation(signupRequest.getDesignation());
        user.setRole(Role.USER); // Default signup role

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Account created successfully!"));
    }

    // --- POST /auth/login ---
    @PostMapping("/login")
    public ResponseEntity<?> authenticateAndGetToken(@RequestBody LoginRequest authRequest) {

        // --- Hardcoded superadmin check ---
        if ("superadmin".equals(authRequest.getUsername()) && "Admin@123".equals(authRequest.getPassword())) {
            User superAdmin = new User();
            superAdmin.setId(0L);
            superAdmin.setUsername("superadmin");
            superAdmin.setRole(Role.ADMIN);

            String token = jwtService.generateToken("superadmin");

            return ResponseEntity.ok(Map.of(
                    "access_token", token,
                    "role", "admin"
            ));
        }

        // This attempts to authenticate the user using the password encoder and UserDetailsService
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        if (authentication.isAuthenticated()) {
            User user = (User) authentication.getPrincipal();

            // Role Check: Deny access if user role doesn't match the requested portal (user_type)
            if (!user.getRole().name().toLowerCase().equals(authRequest.getUser_type())) {
                throw new SecurityException("Access denied. Portal does not match user role (" + user.getRole().name().toLowerCase() + ").");
            }

            String token = jwtService.generateToken(authRequest.getUsername());

            return ResponseEntity.ok(Map.of(
                    "access_token", token,
                    "role", user.getRole().name().toLowerCase()
            ));
        } else {
            throw new UsernameNotFoundException("Invalid user credentials.");
        }
    }

    // DTO for the login request body (must match frontend JSON keys)
    public static class LoginRequest {
        private String username;
        private String password;
        private String user_type; // The expected role from the frontend UI selection

        public String getUsername() { return username; }
        public String getPassword() { return password; }
        public String getUser_type() { return user_type; }

        public void setUsername(String username) { this.username = username; }
        public void setPassword(String password) { this.password = password; }
        public void setUser_type(String user_type) { this.user_type = user_type; }
    }
}
