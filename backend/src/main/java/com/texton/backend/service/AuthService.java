package com.texton.backend.service;

import com.texton.backend.models.User;
import com.texton.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;   // ✅ correct dependency

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;


    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public String login(String username, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        // ✅ No need for UserDetails here since JwtService expects String
        return jwtService.generateToken(username);
    }

    public User signup(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /**
     * ✅ Used in DocumentController to decode token for SSE streaming
     */
    public String getUsernameFromToken(String token) {
        try {
            if (token == null) return null;

            // Remove "Bearer " prefix if present
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            return jwtService.extractUsername(token);

        } catch (Exception e) {
            System.out.println("❌ Invalid token in SSE: " + e.getMessage());
            return null;
        }
    }
}
