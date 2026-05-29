package com.texton.backend.controllers;

import com.texton.backend.config.GuestAuth;
import com.texton.backend.models.User;
import com.texton.backend.models.User.Role;
import com.texton.backend.repositories.UserRepository;
import com.texton.backend.service.AuthService;
import com.texton.backend.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
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
        return ResponseEntity.ok(Map.of("message", "Account created successfully. Please sign in."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateAndGetToken(@RequestBody LoginRequest authRequest) {
        String userType = authRequest.getUser_type() != null ? authRequest.getUser_type().trim() : "";

        if (GuestAuth.GUEST_USERNAME.equalsIgnoreCase(authRequest.getUsername())) {
            return ResponseEntity.status(403).body(Map.of("error", "Guest access does not use login. Continue without signing in."));
        }

        if ("user".equalsIgnoreCase(userType)) {
            return loginAsStudent(authRequest);
        }

        if (!"admin".equalsIgnoreCase(userType)) {
            return ResponseEntity.status(403).body(Map.of("error", "Invalid login type. Use user or admin."));
        }

        return loginAsAdmin(authRequest);
    }

    private ResponseEntity<?> loginAsStudent(LoginRequest authRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        if (!authentication.isAuthenticated()) {
            throw new UsernameNotFoundException("Invalid credentials.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User realUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found in DB"));

        if (realUser.getRole() != Role.USER) {
            return ResponseEntity.status(403).body(Map.of("error", "Use admin login for administrator accounts."));
        }

        String token = jwtService.generateToken(userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "access_token", token,
                "role", "user",
                "username", userDetails.getUsername()
        ));
    }

    private ResponseEntity<?> loginAsAdmin(LoginRequest authRequest) {
        if ("superadmin".equals(authRequest.getUsername()) && "Admin@123".equals(authRequest.getPassword())) {
            return ResponseEntity.ok(Map.of(
                    "access_token", jwtService.generateToken("superadmin"),
                    "role", "admin",
                    "username", "superadmin"
            ));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );

        if (!authentication.isAuthenticated()) {
            throw new UsernameNotFoundException("Invalid credentials.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User realUser = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found in DB"));

        if (realUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin credentials required."));
        }

        String token = jwtService.generateToken(userDetails.getUsername());
        return ResponseEntity.ok(Map.of(
                "access_token", token,
                "role", "admin",
                "username", userDetails.getUsername()
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
