package com.example.KajChai.Service;

import com.example.KajChai.DatabaseEntity.Admin;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.AdminRepository;
import com.example.KajChai.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminDataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeDefaultAdmins();
    }

    private void initializeDefaultAdmins() {
        // Check if any admin already exists
        if (adminRepository.count() > 0) {
            log.info("Admin accounts already exist. Skipping initialization.");
            return;
        }

        log.info("Initializing default admin accounts...");

        // Create default admin account
        createAdminAccount("admin@kajchai.com", "Admin123!", "System Administrator");
        createAdminAccount("moderator@kajchai.com", "Moderator123!", "Forum Moderator");

        log.info("Default admin accounts created successfully.");
    }

    private void createAdminAccount(String email, String password, String name) {
        try {
            // Check if admin already exists
            if (adminRepository.existsByEmail(email)) {
                log.info("Admin account {} already exists. Skipping.", email);
                return;
            }

            // Create Admin entity
            Admin admin = Admin.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .isActive(true)
                    .build();

            adminRepository.save(admin);

            // Also create a corresponding User entity for authentication
            if (!userRepository.existsByEmail(email)) {
                User adminUser = User.builder()
                        .email(email)
                        .password(passwordEncoder.encode(password))
                        .role(UserRole.ADMIN)
                        .enabled(true)
                        .build();

                userRepository.save(adminUser);
            }

            log.info("Created admin account: {} ({})", name, email);

        } catch (Exception e) {
            log.error("Failed to create admin account: {} - {}", email, e.getMessage());
        }
    }
}