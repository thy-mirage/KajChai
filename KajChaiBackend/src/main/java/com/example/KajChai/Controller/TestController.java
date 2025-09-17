package com.example.KajChai.Controller;

import com.example.KajChai.DTO.AuthResponse;
import com.example.KajChai.Repository.UserRepository;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Enum.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/public")
    public ResponseEntity<String> publicEndpoint() {
        return ResponseEntity.ok("This is a public endpoint");
    }

    @GetMapping("/database")
    public ResponseEntity<AuthResponse> testDatabase() {
        try {
            long userCount = userRepository.count();
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(true)
                    .message("Database connection successful! Users count: " + userCount)
                    .build());
        } catch (Exception e) {
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(false)
                    .message("Database connection failed: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        try {
            var users = userRepository.findAll();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", users.size());
            response.put("users", users.stream().map(user -> {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getUserId());
                userInfo.put("email", user.getEmail());
                userInfo.put("role", user.getRole());
                userInfo.put("verified", user.getEnabled());
                return userInfo;
            }).toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch users: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @PostMapping("/create-test-users")
    public ResponseEntity<AuthResponse> createTestUsers() {
        try {
            // Create test admin user
            if (!userRepository.existsByEmail("admin@kajchai.com")) {
                User admin = User.builder()
                    .email("admin@kajchai.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.ADMIN)
                    .enabled(true)
                    .build();
                userRepository.save(admin);
            }

            // Create test customer user and profile
            if (!userRepository.existsByEmail("customer@kajchai.com")) {
                User customer = User.builder()
                    .email("customer@kajchai.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.CUSTOMER)
                    .enabled(true)
                    .build();
                userRepository.save(customer);
            }
            
            // Create corresponding customer profile (check separately)
            if (!customerRepository.existsByGmail("customer@kajchai.com")) {
                Customer customerProfile = Customer.builder()
                    .customerName("Test Customer")
                    .gmail("customer@kajchai.com")
                    .password(passwordEncoder.encode("password123"))
                    .phone("01712345678")
                    .gender("Male")
                    .latitude(23.8103)
                    .longitude(90.4125)
                    .city("Dhaka")
                    .upazila("Dhanmondi")
                    .district("Dhaka")
                    .fullAddress("Dhanmondi, Dhaka, Bangladesh")
                    .build();
                customerRepository.save(customerProfile);
            }

            // Create test worker user and profile
            if (!userRepository.existsByEmail("worker@kajchai.com")) {
                User worker = User.builder()
                    .email("worker@kajchai.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(UserRole.WORKER)
                    .enabled(true)
                    .build();
                userRepository.save(worker);
            }
            
            // Create corresponding worker profile (check separately)
            if (!workerRepository.existsByGmail("worker@kajchai.com")) {
                Worker workerProfile = Worker.builder()
                    .name("Test Worker")
                    .gmail("worker@kajchai.com")
                    .password(passwordEncoder.encode("password123"))
                    .phone("01787654321")
                    .gender("Female")
                    .latitude(23.7947)
                    .longitude(90.4056)
                    .city("Dhaka")
                    .upazila("Gulshan")
                    .district("Dhaka")
                    .fullAddress("Gulshan, Dhaka, Bangladesh")
                    .field("Electrician")
                    .rating(4.5f)
                    .experience(3.0f)
                    .build();
                workerRepository.save(workerProfile);
            }

            return ResponseEntity.ok(AuthResponse.builder()
                    .success(true)
                    .message("Test users created successfully! Login with: admin@kajchai.com, customer@kajchai.com, worker@kajchai.com (password: password123)")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(false)
                    .message("Failed to create test users: " + e.getMessage())
                    .build());
        }
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<AuthResponse> customerEndpoint() {
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Welcome Customer!")
                .build());
    }

    @GetMapping("/worker")
    @PreAuthorize("hasRole('WORKER')")
    public ResponseEntity<AuthResponse> workerEndpoint() {
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Welcome Worker!")
                .build());
    }

    @GetMapping("/protected")
    public ResponseEntity<AuthResponse> protectedEndpoint() {
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("This is a protected endpoint - you are authenticated!")
                .build());
    }
}
