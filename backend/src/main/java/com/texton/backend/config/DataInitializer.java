package com.texton.backend.config;

import com.texton.backend.models.User;
import com.texton.backend.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        if (userRepository.findByUsername("superuser").isEmpty()) {

            User admin = new User();
            admin.setUsername("superuser");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setName("Admin User");
            admin.setEmail("admin@texton.ai");

            // ✅ Fixed enum role (NOT STRING)
            admin.setRole(User.Role.ADMIN);

            userRepository.save(admin);

            System.out.println("✅ Superuser created => username: superuser | password: admin123");
        }
    }
}
