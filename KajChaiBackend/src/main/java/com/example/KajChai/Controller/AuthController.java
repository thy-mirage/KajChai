package com.example.KajChai.Controller;

import com.example.KajChai.DTO.*;
import com.example.KajChai.Service.AuthService;
import com.example.KajChai.Service.EmailVerificationService;
import com.example.KajChai.CloudinaryConfiguration.CloudinaryService;
import com.example.KajChai.Security.JwtUtil;
import com.example.KajChai.DatabaseEntity.Admin;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.Repository.AdminRepository;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Service.UserService;
import com.example.KajChai.Enum.UserRole;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService verificationService;
    private final CloudinaryService cloudinaryService;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final CustomerRepository customerRepository;
    private final WorkerRepository workerRepository;
    private final AdminRepository adminRepository;

    @PostMapping("/signup/initiate")
    public ResponseEntity<AuthResponse> initiateSignup(@Valid @RequestBody SignupRequest request) {
        AuthResponse response = authService.initiateSignup(request);
        return ResponseEntity.status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @PostMapping(value = "/signup/initiate-with-photo", consumes = "multipart/form-data")
    public ResponseEntity<AuthResponse> initiateSignupWithPhoto(
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("role") UserRole role,
            @RequestParam("name") String name,
            @RequestParam("phone") String phone,
            @RequestParam("gender") String gender,
            @RequestParam("city") String city,
            @RequestParam("upazila") String upazila,
            @RequestParam("district") String district,
            @RequestParam(value = "field", required = false) String field,
            @RequestParam(value = "experience", required = false) Float experience,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        
        try {
            String photoUrl = null;
            
            // Upload photo to Cloudinary if provided
            if (photo != null && !photo.isEmpty()) {
                photoUrl = cloudinaryService.uploadFile(photo, "kajchai/profile-photos");
            }
            
            // Create signup request
            SignupRequest request = new SignupRequest();
            request.setEmail(email);
            request.setPassword(password);
            request.setRole(role);
            request.setName(name);
            request.setPhone(phone);
            request.setGender(gender);
            request.setCity(city);
            request.setUpazila(upazila);
            request.setDistrict(district);
            request.setPhoto(photoUrl);
            request.setField(field);
            request.setExperience(experience);
            
            AuthResponse response = authService.initiateSignup(request);
            return ResponseEntity.status(response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                    .body(response);
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Failed to upload photo and initiate signup: " + e.getMessage())
                            .build());
        }
    }

    @PostMapping("/signup/verify")
    public ResponseEntity<AuthResponse> verifyAndCompleteSignup(
            @Valid @RequestBody SignupRequest request,
            @RequestParam String verificationCode) {
        AuthResponse response = authService.completeSignup(request, verificationCode);
        return ResponseEntity.status(response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @PostMapping(value = "/signup/verify-with-photo", consumes = "multipart/form-data")
    public ResponseEntity<AuthResponse> verifyAndCompleteSignupWithPhoto(
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("role") UserRole role,
            @RequestParam("name") String name,
            @RequestParam("phone") String phone,
            @RequestParam("gender") String gender,
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam("city") String city,
            @RequestParam("upazila") String upazila,
            @RequestParam("district") String district,
            @RequestParam(value = "fullAddress", required = false) String fullAddress,
            @RequestParam(value = "field", required = false) String field,
            @RequestParam(value = "experience", required = false) Float experience,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @RequestParam("verificationCode") String verificationCode) {
        
        try {
            String photoUrl = null;
            
            // Upload photo to Cloudinary if provided
            if (photo != null && !photo.isEmpty()) {
                photoUrl = cloudinaryService.uploadFile(photo, "kajchai/profile-photos");
            }
            
            // Create signup request
            SignupRequest request = new SignupRequest();
            request.setEmail(email);
            request.setPassword(password);
            request.setRole(role);
            request.setName(name);
            request.setPhone(phone);
            request.setGender(gender);
            request.setLatitude(latitude);
            request.setLongitude(longitude);
            request.setCity(city);
            request.setUpazila(upazila);
            request.setDistrict(district);
            request.setFullAddress(fullAddress);
            request.setPhoto(photoUrl);
            request.setField(field);
            request.setExperience(experience);
            
            AuthResponse response = authService.completeSignup(request, verificationCode);
            return ResponseEntity.status(response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                    .body(response);
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Failed to upload photo and complete signup: " + e.getMessage())
                            .build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        
        if (authResponse.isSuccess()) {
            // Generate JWT token for successful login
            try {
                User user = userService.findByEmail(request.getEmail());
                Map<String, Object> extraClaims = new HashMap<>();
                extraClaims.put("role", user.getRole().name());
                extraClaims.put("userId", user.getUserId());
                
                String token = jwtUtil.generateToken(user, extraClaims);
                
                // Create HTTP-only secure cookie (for backward compatibility)
                Cookie jwtCookie = new Cookie("jwt", token);
                jwtCookie.setHttpOnly(true);
                jwtCookie.setPath("/");
                jwtCookie.setMaxAge(30 * 60); // 30 minutes
                // jwtCookie.setSecure(true); // Enable for HTTPS
                
                response.addCookie(jwtCookie);
                
                // Also return token in response for localStorage storage
                authResponse.setToken(token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(AuthResponse.builder()
                                .success(false)
                                .message("Login successful but token generation failed")
                                .build());
            }
        }
        
        return ResponseEntity.status(authResponse.isSuccess() ? HttpStatus.OK : HttpStatus.UNAUTHORIZED)
                .body(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(HttpServletResponse response) {
        // Clear the JWT cookie
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0);
        
        response.addCookie(jwtCookie);
        
        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Logged out successfully")
                .build());
    }

    @PostMapping("/admin/login")
    public ResponseEntity<AuthResponse> adminLogin(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.adminLogin(request);
        
        if (authResponse.isSuccess()) {
            // Create HTTP-only secure cookie for admin
            try {
                Cookie jwtCookie = new Cookie("jwt", authResponse.getToken());
                jwtCookie.setHttpOnly(true);
                jwtCookie.setPath("/");
                jwtCookie.setMaxAge(30 * 60); // 30 minutes
                // jwtCookie.setSecure(true); // Enable for HTTPS
                
                response.addCookie(jwtCookie);
                
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(AuthResponse.builder()
                                .success(false)
                                .message("Admin login successful but token generation failed")
                                .build());
            }
        }
        
        return ResponseEntity.status(authResponse.isSuccess() ? HttpStatus.OK : HttpStatus.UNAUTHORIZED)
                .body(authResponse);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<AuthResponse> resendVerificationCode(@RequestParam String email) {
        try {
            verificationService.sendVerificationCode(email);
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(true)
                    .message("Verification code sent successfully")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Failed to send verification code: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(AuthResponse.builder()
                                .success(false)
                                .message("Not authenticated")
                                .build());
            }
            
            User user = (User) authentication.getPrincipal();
            
            // Get user photo and name from database
            String userPhoto = null;
            String userName = null;
            Integer userId = null;
            
            if (user.getRole() == UserRole.CUSTOMER) {
                Optional<Customer> customerOpt = customerRepository.findByGmail(user.getEmail());
                if (customerOpt.isPresent()) {
                    Customer customer = customerOpt.get();
                    userPhoto = customer.getPhoto();
                    userName = customer.getCustomerName();
                    userId = customer.getCustomerId();
                }
            } else if (user.getRole() == UserRole.WORKER) {
                Optional<Worker> workerOpt = workerRepository.findByGmail(user.getEmail());
                if (workerOpt.isPresent()) {
                    Worker worker = workerOpt.get();
                    userPhoto = worker.getPhoto();
                    userName = worker.getName();
                    userId = worker.getWorkerId();
                }
            } else if (user.getRole() == UserRole.ADMIN) {
                Optional<Admin> adminOpt = adminRepository.findByEmail(user.getEmail());
                if (adminOpt.isPresent()) {
                    Admin admin = adminOpt.get();
                    userPhoto = admin.getPhoto();
                    userName = admin.getName();
                    userId = admin.getAdminId();
                }
            }
            
            return ResponseEntity.ok(AuthResponse.builder()
                    .success(true)
                    .message("User information retrieved successfully")
                    .email(user.getEmail())
                    .role(user.getRole())
                    .userId(userId)
                    .name(userName)
                    .photo(userPhoto)
                    .build());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(AuthResponse.builder()
                            .success(false)
                            .message("Failed to get user information: " + e.getMessage())
                            .build());
        }
    }
}
