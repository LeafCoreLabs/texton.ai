package com.texton.backend.config;

import com.texton.backend.models.User;
import com.texton.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${SUPERUSER_PASSWORD:admin123}")
    private String superuserPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername("superuser").isEmpty()) {
            User admin = new User();
            admin.setUsername("superuser");
            admin.setPassword(passwordEncoder.encode(superuserPassword));
            admin.setName("Admin User");
            admin.setEmail("admin@texton.ai");
            admin.setRole(User.Role.ADMIN);
            userRepository.save(admin);
        }

        if (userRepository.findByUsername(GuestAuth.GUEST_USERNAME).isEmpty()) {
            User guest = new User();
            guest.setUsername(GuestAuth.GUEST_USERNAME);
            guest.setPassword(passwordEncoder.encode("guest-not-used"));
            guest.setName("Guest");
            guest.setEmail("guest@texton.ai");
            guest.setRole(User.Role.USER);
            userRepository.save(guest);
        }
    }
}
