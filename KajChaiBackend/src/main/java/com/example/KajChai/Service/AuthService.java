package com.example.KajChai.Service;

import com.example.KajChai.DTO.AuthResponse;
import com.example.KajChai.DTO.LoginRequest;
import com.example.KajChai.DTO.SignupRequest;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Enum.UserRole;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final EmailVerificationService verificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse initiateSignup(SignupRequest request) {
        // Check if user already exists
        if (userService.existsByEmail(request.getEmail()) ||
            customerRepository.existsByGmail(request.getEmail()) ||
            workerRepository.existsByGmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already exists")
                    .build();
        }

        try {
            // Send verification code
            verificationService.sendVerificationCode(request.getEmail());
            
            return AuthResponse.builder()
                    .success(true)
                    .message("Verification code sent to your email")
                    .email(request.getEmail())
                    .build();
        } catch (Exception e) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Failed to send verification email: " + e.getMessage())
                    .build();
        }
    }

    @Transactional
    public AuthResponse completeSignup(SignupRequest request, String verificationCode) {
        try {
            // Verify the code
            boolean isValid = verificationService.verifyCode(request.getEmail(), verificationCode);
            if (!isValid) {
                return AuthResponse.builder()
                        .success(false)
                        .message("Invalid or expired verification code")
                        .build();
            }

            // Create User entity
            User user = User.builder()
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(request.getRole())
                    .enabled(true)
                    .build();

            User savedUser = userService.save(user);

            // Create role-specific entity
            if (request.getRole() == UserRole.CUSTOMER) {
                Customer customer = Customer.builder()
                        .customerName(request.getName())
                        .gmail(request.getEmail())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .photo(request.getPhoto()) // Add photo support
                        .phone(request.getPhone())
                        .gender(request.getGender())
                        .latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .city(request.getCity())
                        .upazila(request.getUpazila())
                        .district(request.getDistrict())
                        .fullAddress(request.getFullAddress())
                        .build();
                customerRepository.save(customer);
            } else if (request.getRole() == UserRole.WORKER) {
                Worker worker = Worker.builder()
                        .name(request.getName())
                        .gmail(request.getEmail())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .photo(request.getPhoto()) // Add photo support
                        .phone(request.getPhone())
                        .gender(request.getGender())
                        .latitude(request.getLatitude())
                        .longitude(request.getLongitude())
                        .city(request.getCity())
                        .upazila(request.getUpazila())
                        .district(request.getDistrict())
                        .fullAddress(request.getFullAddress())
                        .field(request.getField())
                        .experience(request.getExperience() != null ? request.getExperience() : 0.0f)
                        .rating(0.0f)
                        .build();
                workerRepository.save(worker);
            }

            return AuthResponse.builder()
                    .success(true)
                    .message("Account created successfully")
                    .email(request.getEmail())
                    .role(request.getRole())
                    .build();

        } catch (Exception e) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Failed to create account: " + e.getMessage())
                    .build();
        }
    }

    public AuthResponse login(LoginRequest request) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = (User) authentication.getPrincipal();

            // Generate JWT token
            Map<String, Object> extraClaims = new HashMap<>();
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("userId", user.getUserId());

            String token = jwtUtil.generateToken(user, extraClaims);

            return AuthResponse.builder()
                    .success(true)
                    .message("Login successful")
                    .email(user.getEmail())
                    .role(user.getRole())
                    .build();

        } catch (DisabledException e) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Account is not verified. Please verify your email first.")
                    .build();
        } catch (BadCredentialsException e) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid email or password")
                    .build();
        } catch (Exception e) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Login failed: " + e.getMessage())
                    .build();
        }
    }
}
