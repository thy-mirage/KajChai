package com.example.KajChai.Service;

import com.example.KajChai.Controller.ChatBotController.ChatBotResponse;
import com.example.KajChai.DatabaseEntity.Worker;
import com.example.KajChai.DatabaseEntity.Customer;
import com.example.KajChai.DatabaseEntity.User;
import com.example.KajChai.DatabaseEntity.Review;
import com.example.KajChai.DatabaseEntity.HirePost;
import com.example.KajChai.Repository.WorkerRepository;
import com.example.KajChai.Repository.CustomerRepository;
import com.example.KajChai.Repository.ReviewRepository;
import com.example.KajChai.Repository.HirePostRepository;
import com.example.KajChai.Enum.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatBotService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private HirePostRepository hirePostRepository;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String groqModel;

    private static final String[] VALID_CATEGORIES = {
        "customer_queries", "worker_summary", "nearby_workers", 
        "nearby_jobs", "website_howto", "payment_estimation", "out_of_scope"
    };

    public ChatBotResponse processQuestion(String question, Long userId, String userLocation, String userField) {
        try {
            // Get current user's information automatically
            UserInfo currentUser = getCurrentUserInfo();
            System.out.println("DEBUG: processQuestion - userInfo location: '" + currentUser.getLocation() + "'");
            
            // Step 1: Classify the question category with role awareness
            String category = classifyQuestion(question, currentUser.getRole());

            if ("out_of_scope".equals(category)) {
                return new ChatBotResponse(
                    "I'm sorry, but I can only help with questions related to KajChai services, worker information, nearby recommendations, website usage, or payment estimations. Please ask a question related to our platform.",
                    "out_of_scope"
                );
            }

            // Step 2: Process based on category using current user's information
            return processQuestionByCategory(question, category, currentUser);

        } catch (Exception e) {
            return new ChatBotResponse(
                "I'm sorry, I encountered an error while processing your question. Please try again.",
                "error"
            );
        }
    }

    private UserInfo getCurrentUserInfo() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println("DEBUG: User not authenticated");
                return new UserInfo(); // Return empty user info for unauthenticated users
            }
            
            User user = (User) authentication.getPrincipal();
            UserInfo userInfo = new UserInfo();
            userInfo.setEmail(user.getEmail());
            userInfo.setRole(user.getRole());
            
            System.out.println("DEBUG: User email: " + user.getEmail() + ", role: " + user.getRole());
            
            // Get detailed user information based on role
            if (user.getRole() == UserRole.CUSTOMER) {
                Optional<Customer> customerOpt = customerRepository.findByGmail(user.getEmail());
                if (customerOpt.isPresent()) {
                    Customer customer = customerOpt.get();
                    userInfo.setUserId(customer.getCustomerId().longValue());
                    userInfo.setName(customer.getCustomerName());
                    
                    // Use upazila as primary location
                    String location = customer.getUpazila();
                    if (location == null || location.trim().isEmpty()) {
                        // Fallback to city if upazila is not available
                        if (customer.getCity() != null && !customer.getCity().trim().isEmpty()) {
                            location = customer.getCity();
                        } else if (customer.getDistrict() != null && !customer.getDistrict().trim().isEmpty()) {
                            location = customer.getDistrict();
                        } else {
                            // Final fallback for testing - assume Dhaka if no location data
                            location = "Dhaka";
                            System.out.println("DEBUG: No location data found, using default: Dhaka");
                        }
                    }
                    userInfo.setLocation(location);
                    userInfo.setCity(customer.getCity());
                    userInfo.setDistrict(customer.getDistrict());
                    userInfo.setPhone(customer.getPhone());
                    
                    System.out.println("DEBUG: Customer found - Name: " + customer.getCustomerName() + 
                                     ", Upazila: " + customer.getUpazila() + 
                                     ", City: " + customer.getCity() +
                                     ", Final Location: " + location);
                } else {
                    System.out.println("DEBUG: Customer not found for email: " + user.getEmail());
                }
            } else if (user.getRole() == UserRole.WORKER) {
                Optional<Worker> workerOpt = workerRepository.findByGmail(user.getEmail());
                if (workerOpt.isPresent()) {
                    Worker worker = workerOpt.get();
                    userInfo.setUserId(worker.getWorkerId().longValue());
                    userInfo.setName(worker.getName());
                    
                    // Use upazila as primary location
                    String location = worker.getUpazila();
                    if (location == null || location.trim().isEmpty()) {
                        // Fallback to city if upazila is not available
                        if (worker.getCity() != null && !worker.getCity().trim().isEmpty()) {
                            location = worker.getCity();
                        } else if (worker.getDistrict() != null && !worker.getDistrict().trim().isEmpty()) {
                            location = worker.getDistrict();
                        } else {
                            // Final fallback for testing - assume Dhaka if no location data
                            location = "Dhaka";
                            System.out.println("DEBUG: No worker location data found, using default: Dhaka");
                        }
                    }
                    userInfo.setLocation(location);
                    userInfo.setCity(worker.getCity());
                    userInfo.setDistrict(worker.getDistrict());
                    userInfo.setPhone(worker.getPhone());
                    userInfo.setField(worker.getField());
                    
                    System.out.println("DEBUG: Worker found - Name: " + worker.getName() + 
                                     ", Upazila: " + worker.getUpazila() + 
                                     ", City: " + worker.getCity() + 
                                     ", Field: " + worker.getField() +
                                     ", Final Location: " + location);
                } else {
                    System.out.println("DEBUG: Worker not found for email: " + user.getEmail());
                }
            }
            
            System.out.println("DEBUG: Final userInfo location: " + userInfo.getLocation());
            return userInfo;
            
        } catch (Exception e) {
            System.out.println("DEBUG: Exception in getCurrentUserInfo: " + e.getMessage());
            e.printStackTrace();
            return new UserInfo(); // Return empty user info on error
        }
    }

    // Helper class to hold user information
    private static class UserInfo {
        private Long userId;
        private String name;
        private String email;
        private UserRole role;
        private String location;
        private String city;
        private String district;
        private String phone;
        private String field;

        // Constructors
        public UserInfo() {}

        // Getters and Setters
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public UserRole getRole() { return role; }
        public void setRole(UserRole role) { this.role = role; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getDistrict() { return district; }
        public void setDistrict(String district) { this.district = district; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getField() { return field; }
        public void setField(String field) { this.field = field; }
    }

    private String classifyQuestion(String question, UserRole userRole) {
        // Rule-based classification for common patterns first
        String lowerQuestion = question.toLowerCase().trim();
        
        // Check for worker summary requests first (highest priority)
        if (lowerQuestion.matches(".*\\b(tell me about|about|info about|information about|describe|details about|summary of|who is)\\s+\\w+.*") ||
            lowerQuestion.matches(".*\\b(tell me about|about|info about|information about|describe|details about|summary of|who is)\\s+\\w+\\s+\\w+.*")) {
            System.out.println("DEBUG: Detected worker summary request pattern");
            return "worker_summary";
        }
        
        // Role-aware classification rules
        if (userRole == UserRole.CUSTOMER) {
            // For customers asking for jobs, classify as nearby_jobs so they get the restriction message
            if (lowerQuestion.contains("find me job") || lowerQuestion.contains("show me job") || 
                lowerQuestion.contains("need job") || lowerQuestion.contains("looking for job") ||
                lowerQuestion.contains("find job") || lowerQuestion.contains("show job") ||
                lowerQuestion.contains("job near me") || lowerQuestion.contains("work near me") ||
                lowerQuestion.contains("posts around me") || lowerQuestion.contains("see the posts")) {
                System.out.println("DEBUG: Customer asking for jobs, classifying as nearby_jobs for restriction message");
                return "nearby_jobs";
            }
        }
        
        if (userRole == UserRole.WORKER) {
            // For workers asking for workers, classify as nearby_workers so they get the restriction message
            if (lowerQuestion.contains("find me worker") || lowerQuestion.contains("show me worker") || 
                lowerQuestion.contains("need worker") || lowerQuestion.contains("looking for worker") ||
                lowerQuestion.contains("find worker") || lowerQuestion.contains("show worker") ||
                lowerQuestion.contains("find electrician") || lowerQuestion.contains("find plumber") ||
                lowerQuestion.contains("show me electrician") || lowerQuestion.contains("need electrician") ||
                lowerQuestion.contains("need plumber") || lowerQuestion.contains("workers near me")) {
                System.out.println("DEBUG: Worker asking for other workers, classifying as nearby_workers for restriction message");
                return "nearby_workers";
            }
        }
        
        // Standard role-appropriate classifications
        if (userRole == UserRole.CUSTOMER) {
            // Check for worker-related requests (customers looking for service providers)
            if (lowerQuestion.contains("find me worker") || lowerQuestion.contains("show me worker") || 
                lowerQuestion.contains("need worker") || lowerQuestion.contains("looking for worker") ||
                lowerQuestion.contains("find worker") || lowerQuestion.contains("show worker") ||
                lowerQuestion.contains("find electrician") || lowerQuestion.contains("find plumber") ||
                lowerQuestion.contains("show me electrician") || lowerQuestion.contains("need electrician") ||
                lowerQuestion.contains("need plumber") || lowerQuestion.contains("workers near me") ||
                lowerQuestion.contains("quickly need")) {
                System.out.println("DEBUG: Rule-based classification for customer: nearby_workers");
                return "nearby_workers";
            }
        }
        
        if (userRole == UserRole.WORKER) {
            // Check for job-related requests (workers looking for work)
            if (lowerQuestion.contains("find me job") || lowerQuestion.contains("show me job") || 
                lowerQuestion.contains("need job") || lowerQuestion.contains("looking for job") ||
                lowerQuestion.contains("find job") || lowerQuestion.contains("show job") ||
                lowerQuestion.contains("job near me") || lowerQuestion.contains("work near me") ||
                lowerQuestion.contains("posts around me") || lowerQuestion.contains("see the posts")) {
                System.out.println("DEBUG: Rule-based classification for worker: nearby_jobs");
                return "nearby_jobs";
            }
        }
        
        // Fall back to AI classification for other questions with role awareness
        String roleContext = userRole == UserRole.CUSTOMER ? 
            "The user is a CUSTOMER looking for service providers." : 
            "The user is a WORKER looking for job opportunities.";
            
        String classificationPrompt = String.format("""
            You are a query classifier for KajChai, a household service platform in Bangladesh. 
            %s
            
            Classify the following question into one of these categories:
            
            1. customer_queries - Questions about household problems, services, maintenance tips, cleaning advice, repair guidance
            2. worker_summary - Questions asking about specific workers, their experience, ratings, or reviews
            3. nearby_workers - Questions about finding workers/service providers near a location (ONLY for CUSTOMERS)
            4. nearby_jobs - Questions about finding job posts/work opportunities near a location (ONLY for WORKERS)
            5. website_howto - Questions about how to use the website, post jobs, write reviews, contact workers
            6. payment_estimation - Questions asking for cost estimates for specific services or repairs
            7. out_of_scope - Questions not related to the above categories
            
            Role-based rules:
            - If user is CUSTOMER and asks about jobs/work, classify as "nearby_workers" (redirect to find workers instead)
            - If user is WORKER and asks about workers/electricians, classify as "nearby_jobs" (redirect to find jobs instead)
            - CUSTOMERS should primarily use "nearby_workers" for finding service providers
            - WORKERS should primarily use "nearby_jobs" for finding work opportunities
            
            Question: "%s"
            
            Respond with only the category name (e.g., "customer_queries").
            """, roleContext, question);

        String category = callGroqAPI(classificationPrompt).toLowerCase().trim();
        System.out.println("DEBUG: Question: '" + question + "' classified as: '" + category + "' for role: " + userRole);
        return category;
    }

    private ChatBotResponse processQuestionByCategory(String question, String category, UserInfo userInfo) {
        // Role-based access control
        if (userInfo.getRole() == UserRole.CUSTOMER && "nearby_jobs".equals(category)) {
            System.out.println("DEBUG: Customer trying to access job posts, providing restriction message");
            return new ChatBotResponse(
                "As a customer you can not see others job posts, you can see your job posts in the create post section. Rather do you need to find any worker?",
                "nearby_jobs"
            );
        }
        
        if (userInfo.getRole() == UserRole.WORKER && "nearby_workers".equals(category)) {
            System.out.println("DEBUG: Worker trying to access worker search, providing restriction message");
            return new ChatBotResponse(
                "As a worker, you can not search for other workers, you can search for available works or hire posts instead",
                "nearby_workers"
            );
        }
        
        switch (category) {
            case "customer_queries":
                return handleCustomerQueries(question);
            case "worker_summary":
                return handleWorkerSummary(question, userInfo.getLocation());
            case "nearby_workers":
                return handleNearbyWorkers(question, userInfo.getLocation());
            case "nearby_jobs":
                return handleNearbyJobs(question, userInfo.getLocation(), userInfo);
            case "website_howto":
                return handleWebsiteHowTo(question);
            case "payment_estimation":
                return handlePaymentEstimation(question);
            default:
                return new ChatBotResponse(
                    "I'm not sure how to help with that. Please ask about our services, workers, or how to use the platform.",
                    "unknown"
                );
        }
    }

    private ChatBotResponse handleCustomerQueries(String question) {
        String prompt = String.format("""
            You are a helpful assistant for KajChai, a household service platform in Bangladesh. 
            Answer the following household service related question with practical advice suitable for Bangladesh context.
            Provide helpful, actionable information about household maintenance, cleaning, repairs, or services.
            Keep the response concise but informative (2-4 sentences).
            
            Question: %s
            """, question);

        String response = callGroqAPI(prompt);
        return new ChatBotResponse(response, "customer_queries");
    }

    private ChatBotResponse handleWorkerSummary(String question, String userLocation) {
        // Extract worker name from question
        String workerName = extractWorkerName(question);
        
        if (workerName == null || workerName.trim().isEmpty()) {
            ChatBotResponse response = new ChatBotResponse(
                "Please provide the worker's name so I can find their information for you.",
                "worker_summary"
            );
            response.setNeedsFollowUp(true);
            response.setFollowUpPrompt("worker_name");
            return response;
        }

        // Search for workers by name
        List<Worker> workers = workerRepository.findByNameContainingIgnoreCase(workerName);
        
        if (workers.isEmpty()) {
            return new ChatBotResponse(
                String.format("Sorry, I couldn't find any worker named '%s' on our platform.\n\n" +
                             "You can try:\n" +
                             "• Checking the spelling of the name\n" +
                             "• Searching for workers by their service (e.g., 'find electricians near me')\n" +
                             "• Browsing available workers in your area\n\n" +
                             "Would you like me to help you find workers by service type instead?", workerName),
                "worker_summary"
            );
        }

        if (workers.size() == 1) {
            return generateWorkerSummary(workers.get(0));
        } else {
            // Multiple workers found - need clarification
            StringBuilder response = new StringBuilder("I found multiple workers named '").append(workerName).append("':\n\n");
            for (int i = 0; i < workers.size(); i++) {
                Worker worker = workers.get(i);
                response.append(String.format("%d. %s - %s (%s)\n", 
                    i + 1, worker.getName(), worker.getField(), getWorkerLocation(worker)));
            }
            response.append("\nPlease specify which worker you're asking about by mentioning their field of work or location.");

            ChatBotResponse chatResponse = new ChatBotResponse(response.toString(), "worker_summary");
            chatResponse.setNeedsFollowUp(true);
            chatResponse.setFollowUpPrompt("worker_selection");
            Map<String, Object> context = new HashMap<>();
            context.put("workers", workers);
            context.put("original_name", workerName);
            chatResponse.setConversationContext(context);
            return chatResponse;
        }
    }

    private boolean areNamesMatching(String workerName, String inputName) {
        // Split names into parts for better matching
        String[] workerParts = workerName.toLowerCase().split("\\s+");
        String[] inputParts = inputName.toLowerCase().split("\\s+");
        
        // Check if all input parts match some worker name parts
        for (String inputPart : inputParts) {
            boolean found = false;
            for (String workerPart : workerParts) {
                if (workerPart.contains(inputPart) || inputPart.contains(workerPart)) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }

    private String getWorkerLocation(Worker worker) {
        if (worker.getFullAddress() != null && !worker.getFullAddress().trim().isEmpty()) {
            return worker.getFullAddress();
        }
        
        // Construct location from available fields (upazila and district only)
        List<String> locationParts = new ArrayList<>();
        
        if (worker.getUpazila() != null && !worker.getUpazila().trim().isEmpty()) {
            locationParts.add(worker.getUpazila());
        }
        if (worker.getDistrict() != null && !worker.getDistrict().trim().isEmpty()) {
            locationParts.add(worker.getDistrict());
        }
        
        if (locationParts.isEmpty()) {
            return "Location not specified";
        }
        
        return String.join(", ", locationParts);
    }

    private ChatBotResponse generateWorkerSummary(Worker worker) {
        // Get reviews for this worker
        List<Review> reviews = reviewRepository.findByWorker(worker);
        
        StringBuilder reviewText = new StringBuilder();
        double averageRating = worker.getRating(); // Use the calculated rating from Worker entity
        
        if (!reviews.isEmpty()) {
            for (Review review : reviews) {
                reviewText.append(String.format("Rating: %d/5, Comment: %s\n", 
                    review.getRating(), review.getMessage()));
            }
        }

        String workerLocation = getWorkerLocation(worker);

        String prompt = String.format("""
            Generate a professional 2-3 line summary for this worker based on their reviews.
            
            Worker: %s
            Field: %s
            Location: %s
            Experience: %.1f years
            Average Rating: %.1f/5 (%d reviews)
            
            Reviews:
            %s
            
            Create a concise summary highlighting their strengths and work quality. 
            If no reviews are available, mention they are new to the platform.
            """, 
            worker.getName(), 
            worker.getField(), 
            workerLocation,
            worker.getExperience(),
            averageRating,
            reviews.size(),
            reviewText.toString()
        );

        String aiSummary = callGroqAPI(prompt);
        
        String fullResponse = String.format("""
            **%s** - %s
            📍 Location: %s
            ⭐ Rating: %.1f/5 (%d reviews)
            🔧 Experience: %.1f years
            📞 Phone: %s
            
            %s
            """, 
            worker.getName(),
            worker.getField(),
            workerLocation,
            averageRating,
            reviews.size(),
            worker.getExperience(),
            worker.getPhone(),
            aiSummary
        );

        return new ChatBotResponse(fullResponse, "worker_summary");
    }

    private ChatBotResponse handleNearbyWorkers(String question, String userLocation) {
        System.out.println("DEBUG: handleNearbyWorkers called with userLocation: '" + userLocation + "'");
        
        String field = extractFieldFromQuestion(question);
        System.out.println("DEBUG: Extracted field from question: '" + field + "'");
        
        if (field == null || field.trim().isEmpty()) {
            String responseText;
            // Check if this was a job-related query that got redirected
            if (question.toLowerCase().contains("job") || question.toLowerCase().contains("post")) {
                responseText = "I see you're looking for services! Please select the type of service you need:\n\n" +
                             "🔌 **Electrician** - Electrical work, wiring, repairs\n" +
                             "🔧 **Plumber** - Plumbing, pipes, water systems\n" +
                             "🪚 **Carpenter** - Woodwork, furniture, repairs\n" +
                             "🎨 **Painter** - House painting, wall painting\n" +
                             "🧹 **Maid** - Cleaning, housekeeping services\n" +
                             "👨‍🍳 **Chef** - Cooking, meal preparation\n" +
                             "🚗 **Driver** - Transportation services\n" +
                             "📸 **Photographer** - Photography services\n\n" +
                             "Just type the service name (e.g., 'Electrician' or 'Chef')";
            } else {
                responseText = "Please select the type of service you need:\n\n" +
                             "🔌 **Electrician** - Electrical work, wiring, repairs\n" +
                             "🔧 **Plumber** - Plumbing, pipes, water systems\n" +
                             "🪚 **Carpenter** - Woodwork, furniture, repairs\n" +
                             "🎨 **Painter** - House painting, wall painting\n" +
                             "🧹 **Maid** - Cleaning, housekeeping services\n" +
                             "👨‍🍳 **Chef** - Cooking, meal preparation\n" +
                             "🚗 **Driver** - Transportation services\n" +
                             "📸 **Photographer** - Photography services\n\n" +
                             "Just type the service name (e.g., 'Electrician' or 'Chef')";
            }
            
            ChatBotResponse response = new ChatBotResponse(responseText, "nearby_workers");
            response.setNeedsFollowUp(true);
            response.setFollowUpPrompt("service_field");
            // Store the user location for the follow-up
            Map<String, Object> context = new HashMap<>();
            context.put("user_location", userLocation);
            response.setConversationContext(context);
            System.out.println("DEBUG: Storing user location '" + userLocation + "' for service_field follow-up");
            return response;
        }

        if (userLocation == null || userLocation.trim().isEmpty()) {
            System.out.println("DEBUG: User location is null or empty, asking for location");
            ChatBotResponse response = new ChatBotResponse(
                "I couldn't automatically detect your location. Please provide your area/upazila so I can find nearby workers for you.",
                "nearby_workers"
            );
            response.setNeedsFollowUp(true);
            response.setFollowUpPrompt("user_location");
            return response;
        }

        // Find workers by field
        List<Worker> workers = workerRepository.findByFieldIgnoreCase(field);

        if (workers.isEmpty()) {
            return new ChatBotResponse(
                String.format("I couldn't find any %s workers. You might want to try a different service type.", field),
                "nearby_workers"
            );
        }

        // Filter by location similarity (prioritize upazila) and sort by rating
        workers = workers.stream()
            .filter(w -> {
                // Check if worker location matches user location
                boolean matches = false;
                
                // Check upazila match
                if (w.getUpazila() != null && w.getUpazila().toLowerCase().contains(userLocation.toLowerCase())) {
                    matches = true;
                }
                // Check city match
                if (!matches && w.getCity() != null && w.getCity().toLowerCase().contains(userLocation.toLowerCase())) {
                    matches = true;
                }
                // Check district match
                if (!matches && w.getDistrict() != null && w.getDistrict().toLowerCase().contains(userLocation.toLowerCase())) {
                    matches = true;
                }
                // Check fullAddress match as backup
                if (!matches && w.getFullAddress() != null && w.getFullAddress().toLowerCase().contains(userLocation.toLowerCase())) {
                    matches = true;
                }
                
                return matches;
            })
            .sorted((w1, w2) -> Float.compare(w2.getRating(), w1.getRating()))
            .limit(5)
            .collect(Collectors.toList());

        if (workers.isEmpty()) {
            // If no local workers found, get top rated workers from any location
            workers = workerRepository.findByFieldIgnoreCase(field).stream()
                .sorted((w1, w2) -> Float.compare(w2.getRating(), w1.getRating()))
                .limit(5)
                .collect(Collectors.toList());
        }

        StringBuilder response = new StringBuilder(String.format("Here are the top %s workers", field));
        if (!workers.isEmpty() && 
            ((workers.get(0).getUpazila() != null && workers.get(0).getUpazila().toLowerCase().contains(userLocation.toLowerCase())) ||
             (workers.get(0).getCity() != null && workers.get(0).getCity().toLowerCase().contains(userLocation.toLowerCase())))) {
            response.append(String.format(" near %s", userLocation));
        }
        response.append(":\n\n");
        
        for (int i = 0; i < workers.size(); i++) {
            Worker worker = workers.get(i);
            List<Review> workerReviews = reviewRepository.findByWorker(worker);
            
            response.append(String.format("%d. **%s**\n", i + 1, worker.getName()));
            response.append(String.format("   📍 %s\n", getWorkerLocation(worker)));
            response.append(String.format("   ⭐ %.1f/5 (%d reviews)\n", worker.getRating(), workerReviews.size()));
            response.append(String.format("   🔧 %.1f years experience\n", worker.getExperience()));
            response.append(String.format("   📞 %s\n\n", worker.getPhone()));
        }

        return new ChatBotResponse(response.toString(), "nearby_workers");
    }

    private ChatBotResponse handleNearbyJobs(String question, String userLocation, UserInfo userInfo) {
        System.out.println("DEBUG: handleNearbyJobs called with userLocation: '" + userLocation + "', userRole: " + userInfo.getRole());
        
        String userField;
        
        // If user is a worker, use their existing field
        if (userInfo.getRole() == UserRole.WORKER && userInfo.getField() != null && !userInfo.getField().trim().isEmpty()) {
            userField = userInfo.getField();
            System.out.println("DEBUG: Using worker's existing field: '" + userField + "'");
        } else {
            // For customers or workers without a field, extract from question
            userField = extractFieldFromQuestion(question);
            System.out.println("DEBUG: Extracted field from question for jobs: '" + userField + "'");
        }
        
        if (userField == null || userField.trim().isEmpty()) {
            ChatBotResponse response = new ChatBotResponse(
                "Please specify your field of work so I can find relevant job posts for you.",
                "nearby_jobs"
            );
            response.setNeedsFollowUp(true);
            response.setFollowUpPrompt("worker_field");
            return response;
        }

        if (userLocation == null || userLocation.trim().isEmpty()) {
            System.out.println("DEBUG: User location is null or empty for jobs, asking for location");
            ChatBotResponse response = new ChatBotResponse(
                "I couldn't automatically detect your location. Please provide your area/upazila so I can find nearby job posts for you.",
                "nearby_jobs"
            );
            response.setNeedsFollowUp(true);
            response.setFollowUpPrompt("worker_location");
            return response;
        }

        // Find available job posts by field
        List<HirePost> jobPosts = hirePostRepository.findByFieldAndStatusOrderByPostTimeDesc(userField, 
            com.example.KajChai.Enum.HirePostStatus.AVAILABLE);

        if (jobPosts.isEmpty()) {
            return new ChatBotResponse(
                String.format("I couldn't find any %s job posts currently. You might want to check back later for new posts.", userField),
                "nearby_jobs"
            );
        }

        // Filter by location and limit to 5
        jobPosts = jobPosts.stream()
            .filter(post -> post.getCustomer() != null && post.getCustomer().getFullAddress() != null &&
                           (post.getCustomer().getFullAddress().toLowerCase().contains(userLocation.toLowerCase()) ||
                            post.getCustomer().getCity() != null && post.getCustomer().getCity().toLowerCase().contains(userLocation.toLowerCase()) ||
                            post.getCustomer().getDistrict() != null && post.getCustomer().getDistrict().toLowerCase().contains(userLocation.toLowerCase())))
            .limit(5)
            .collect(Collectors.toList());

        if (jobPosts.isEmpty()) {
            // If no local jobs, show recent jobs from any location
            jobPosts = hirePostRepository.findByFieldAndStatusOrderByPostTimeDesc(userField, 
                com.example.KajChai.Enum.HirePostStatus.AVAILABLE).stream()
                .limit(5)
                .collect(Collectors.toList());
        }

        StringBuilder response = new StringBuilder(String.format("Here are recent %s job posts", userField));
        if (!jobPosts.isEmpty() && jobPosts.get(0).getCustomer().getFullAddress() != null &&
            jobPosts.get(0).getCustomer().getFullAddress().toLowerCase().contains(userLocation.toLowerCase())) {
            response.append(String.format(" near %s", userLocation));
        }
        response.append(":\n\n");
        
        for (int i = 0; i < jobPosts.size(); i++) {
            HirePost post = jobPosts.get(i);
            // Get customer location using the same logic as user info
            String customerLocation = "Location not specified";
            if (post.getCustomer() != null) {
                if (post.getCustomer().getUpazila() != null && !post.getCustomer().getUpazila().trim().isEmpty()) {
                    customerLocation = post.getCustomer().getUpazila();
                } else if (post.getCustomer().getCity() != null && !post.getCustomer().getCity().trim().isEmpty()) {
                    customerLocation = post.getCustomer().getCity();
                } else if (post.getCustomer().getDistrict() != null && !post.getCustomer().getDistrict().trim().isEmpty()) {
                    customerLocation = post.getCustomer().getDistrict();
                } else if (post.getCustomer().getFullAddress() != null && !post.getCustomer().getFullAddress().trim().isEmpty()) {
                    customerLocation = post.getCustomer().getFullAddress();
                }
            }
            
            response.append(String.format("%d. **%s**\n", i + 1, post.getDescription()));
            response.append(String.format("   📍 %s\n", customerLocation));
            response.append(String.format("   💰 Budget: %s\n", post.getEstimatedPayment()));
            response.append(String.format("   📅 Posted: %s\n", post.getPostTime().format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))));
            response.append(String.format("   📝 %s\n\n", post.getDescription().length() > 100 ? 
                post.getDescription().substring(0, 100) + "..." : post.getDescription()));
        }

        return new ChatBotResponse(response.toString(), "nearby_jobs");
    }

    private ChatBotResponse handleWebsiteHowTo(String question) {
        String prompt = String.format("""
            You are a comprehensive guide for KajChai, a household service platform in Bangladesh. 
            Answer questions about how to use the website with detailed, step-by-step instructions.
            
            WEBSITE STRUCTURE & MAIN PAGES:
            
            🏠 **DASHBOARD** (Home Page):
            - Shows welcome message with user role (Customer/Worker)
            - Displays key statistics: active posts, completed jobs, earnings, ratings
            - Quick action buttons for main features
            - Recent activity feed
            - Role-specific stats and actions
            
            👤 **MY PROFILE** (/my-profile):
            - For Customers: Edit name, email, phone, location (upazila, city, district), photo
            - For Workers: Edit all above + field of work, experience, hourly rate, description
            - Profile photo upload
            - Location details with upazila/city/district
            
            📝 **CREATE JOB POST** (/create-post) - CUSTOMERS ONLY:
            - Create hire posts for work needed
            - Fill description, select field (Electrician, Plumber, Carpenter, Painter, Maid, Chef, Driver, Photographer)
            - Set estimated payment and deadline
            - Upload up to 5 images
            - Post gets published for workers to see
            
            💼 **JOBS PAGE** (/jobs) - ROLE-BASED:
            - For Customers: Browse and search available workers by field and location
            - For Workers: View available hire posts/job opportunities
            - Filter by service type, location, ratings
            - Contact workers or apply to jobs
            
            💬 **CHAT/MESSAGES** (/chat):
            - Real-time messaging between customers and workers
            - Chat rooms created automatically when contacting workers
            - Send text messages and images
            - Online status indicators
            - Message history and notifications
            
            👥 **FORUM** (/forum):
            - Three sections: Customer Q&A, Worker Tips & Projects, Customer Experience
            - Create posts, ask questions, share experiences
            - Comment and interact with community
            - Search and filter by categories
            - Different access levels based on user role
            
            🔔 **NOTIFICATIONS** (/notifications):
            - View all notifications (job applications, messages, reviews)
            - Mark as read/unread
            - Filter by read status
            - Delete notifications
            - Real-time updates
            
            ⭐ **REVIEWS** (/reviews) - CUSTOMERS ONLY:
            - Search workers by name or field
            - View worker profiles and existing reviews
            - Write reviews for workers you've hired
            - Rate workers 1-5 stars with comments
            - Upload images with reviews
            
            🌐 **LANGUAGE SUPPORT**:
            - Switch between English and Bengali
            - All interface elements translated
            - Consistent language across all pages
            
            🔐 **AUTHENTICATION**:
            - Login (/login) and Signup (/signup) pages
            - Role-based access (Customer vs Worker)
            - Password reset functionality
            - Protected routes requiring login
            
            KEY FEATURES & HOW TO USE:
            
            🎯 **For Customers:**
            1. Create job posts with detailed descriptions
            2. Browse workers by service type and location
            3. Contact workers via chat
            4. Track job applications and responses
            5. Leave reviews after job completion
            
            🔧 **For Workers:**
            1. Browse available job posts in your field
            2. Apply to jobs that match your skills
            3. Chat with potential customers
            4. Build your profile with experience and portfolio
            5. Receive reviews and build reputation
            
            🔍 **Search & Filter:**
            - Workers can be filtered by field and location
            - Jobs can be filtered by service type
            - Forum posts searchable by category
            - Location-based matching (upazila, city, district)
            
            📱 **Mobile-Friendly Design:**
            - Responsive design works on all devices
            - Touch-friendly interface
            - Optimized for mobile usage
            
            Question: %s
            
            Provide clear, detailed instructions with specific page names and step-by-step guidance.
            Use bullet points and include relevant page URLs when helpful.
            """, question);

        String response = callGroqAPI(prompt);
        return new ChatBotResponse(response, "website_howto");
    }

    private ChatBotResponse handlePaymentEstimation(String question) {
        String prompt = String.format("""
            You are a cost estimation expert for household services in Bangladesh. 
            Provide a realistic cost estimate for the service described in the question.
            
            Consider Bangladesh market rates and mention that prices may vary based on:
            - Location (Dhaka vs other cities)
            - Complexity of the work
            - Materials needed
            - Time required
            - Worker experience level
            
            Question: %s
            
            Provide a price range in BDT (Bangladeshi Taka) and explain the factors that influence the cost.
            Keep it concise but informative.
            """, question);

        String response = callGroqAPI(prompt);
        return new ChatBotResponse(response, "payment_estimation");
    }

    public ChatBotResponse handleFollowUp(String originalQuestion, String followUpResponse, 
                                         Map<String, Object> conversationContext, Long userId, 
                                         String userLocation, String userField) {
        
        System.out.println("DEBUG: handleFollowUp - conversationContext keys: " + (conversationContext != null ? conversationContext.keySet() : "null"));
        String promptType = (String) conversationContext.get("followUpPrompt");
        System.out.println("DEBUG: handleFollowUp - promptType: '" + promptType + "'");
        
        if (promptType == null || promptType.trim().isEmpty()) {
            System.out.println("DEBUG: promptType is null or empty, returning error");
            return new ChatBotResponse(
                "I'm sorry, there was an issue processing your follow-up. Please try asking your question again.",
                "error"
            );
        }
        
        switch (promptType) {
            case "worker_name":
                return handleWorkerSummary(followUpResponse, userLocation);
            case "worker_selection":
                return handleWorkerSelection(followUpResponse, conversationContext);
            case "service_field":
                // Validate if the service field is valid
                if (!isValidServiceField(followUpResponse)) {
                    return new ChatBotResponse(
                        "I'm sorry, but '" + followUpResponse + "' is not a valid service category on our platform.\n\n" +
                        "Please choose from these available services:\n" +
                        "🔌 **Electrician** - Electrical work, wiring, repairs\n" +
                        "🔧 **Plumber** - Plumbing, pipes, water systems\n" +
                        "🪚 **Carpenter** - Woodwork, furniture, repairs\n" +
                        "🎨 **Painter** - Painting, wall work, decorating\n" +
                        "🧹 **Maid** - Cleaning, housekeeping services\n" +
                        "👨‍🍳 **Chef** - Cooking, meal preparation\n" +
                        "🚗 **Driver** - Transportation, driving services\n" +
                        "📸 **Photographer** - Photography, photo services\n\n" +
                        "Just type the service name (e.g., 'Electrician' or 'Chef')",
                        "service_field"
                    );
                }
                
                // Get the original user location from conversation context or use the provided userLocation
                String originalUserLocation = (String) conversationContext.get("user_location");
                if (originalUserLocation == null || originalUserLocation.trim().isEmpty()) {
                    originalUserLocation = userLocation;
                }
                System.out.println("DEBUG: service_field follow-up - using location: '" + originalUserLocation + "'");
                return handleNearbyWorkers(originalQuestion + " " + followUpResponse, originalUserLocation);
            case "user_location":
                conversationContext.put("user_location", followUpResponse);
                // Create UserInfo object for the context
                UserInfo userInfo = new UserInfo();
                userInfo.setLocation(followUpResponse);
                userInfo.setField((String) conversationContext.get("user_field"));
                return processQuestionByCategory(originalQuestion, "nearby_workers", userInfo);
            case "worker_field":
                // Create UserInfo for follow-up context
                UserInfo tempUserInfo1 = new UserInfo();
                tempUserInfo1.setRole(UserRole.WORKER); // Assume worker for job search follow-up
                tempUserInfo1.setLocation(userLocation);
                return handleNearbyJobs(originalQuestion + " " + followUpResponse, userLocation, tempUserInfo1);
            case "worker_location":
                // Create UserInfo for follow-up context  
                UserInfo tempUserInfo2 = new UserInfo();
                tempUserInfo2.setRole(UserRole.WORKER); // Assume worker for job search follow-up
                tempUserInfo2.setField(userField);
                return handleNearbyJobs(originalQuestion, followUpResponse, tempUserInfo2);
            default:
                return new ChatBotResponse("I'm sorry, I didn't understand your response. Please try asking your question again.", "error");
        }
    }

    @SuppressWarnings("unchecked")
    private ChatBotResponse handleWorkerSelection(String selection, Map<String, Object> conversationContext) {
        List<Object> workersData = (List<Object>) conversationContext.get("workers");
        
        if (workersData == null || workersData.isEmpty()) {
            return new ChatBotResponse(
                "I'm sorry, I couldn't find the worker information. Please try your search again.",
                "error"
            );
        }
        
        // Convert LinkedHashMap objects back to Worker objects
        List<Worker> workers = new ArrayList<>();
        for (Object workerData : workersData) {
            if (workerData instanceof LinkedHashMap) {
                @SuppressWarnings("unchecked")
                Map<String, Object> workerMap = (Map<String, Object>) workerData;
                Worker worker = convertMapToWorker(workerMap);
                if (worker != null) {
                    workers.add(worker);
                }
            } else if (workerData instanceof Worker) {
                workers.add((Worker) workerData);
            }
        }
        
        if (workers.isEmpty()) {
            return new ChatBotResponse(
                "I'm sorry, I couldn't process the worker information. Please try your search again.",
                "error"
            );
        }
        
        // Try to parse selection as number
        try {
            int index = Integer.parseInt(selection.trim()) - 1;
            if (index >= 0 && index < workers.size()) {
                return generateWorkerSummary(workers.get(index));
            }
        } catch (NumberFormatException e) {
            // Try to match by name first (most specific)
            String normalizedSelection = selection.toLowerCase().trim();
            
            // Remove common prefixes like "tell me about", "about", etc.
            normalizedSelection = normalizedSelection.replaceAll("^(tell me about|about|details of|info about|information about)\\s*", "");
            
            for (Worker worker : workers) {
                String workerName = worker.getName().toLowerCase();
                
                // Check for exact name match or partial name match
                if (workerName.equals(normalizedSelection) || 
                    workerName.contains(normalizedSelection) ||
                    normalizedSelection.contains(workerName) ||
                    areNamesMatching(workerName, normalizedSelection)) {
                    return generateWorkerSummary(worker);
                }
            }
            
            // If no name match, try to match by field or location
            for (Worker worker : workers) {
                String workerLocation = getWorkerLocation(worker);
                if (normalizedSelection.contains(worker.getField().toLowerCase()) ||
                    (!workerLocation.equals("Location not specified") && normalizedSelection.contains(workerLocation.toLowerCase()))) {
                    return generateWorkerSummary(worker);
                }
            }
        }
        
        return new ChatBotResponse(
            "Please select a worker by number (1, 2, 3, etc.) or mention their field of work.",
            "worker_summary"
        );
    }
    
    private Worker convertMapToWorker(Map<String, Object> workerMap) {
        try {
            Worker worker = new Worker();
            worker.setWorkerId(workerMap.get("workerId") != null ? ((Number) workerMap.get("workerId")).intValue() : null);
            worker.setName((String) workerMap.get("name"));
            worker.setField((String) workerMap.get("field"));
            worker.setUpazila((String) workerMap.get("upazila"));
            worker.setCity((String) workerMap.get("city"));
            worker.setDistrict((String) workerMap.get("district"));
            worker.setFullAddress((String) workerMap.get("fullAddress"));
            worker.setPhone((String) workerMap.get("phone"));
            worker.setGmail((String) workerMap.get("gmail"));
            worker.setExperience(workerMap.get("experience") != null ? ((Number) workerMap.get("experience")).floatValue() : 0.0f);
            worker.setRating(workerMap.get("rating") != null ? ((Number) workerMap.get("rating")).floatValue() : 0.0f);
            worker.setPhoto((String) workerMap.get("photo"));
            worker.setGender((String) workerMap.get("gender"));
            worker.setPassword((String) workerMap.get("password"));
            worker.setLatitude(workerMap.get("latitude") != null ? ((Number) workerMap.get("latitude")).doubleValue() : null);
            worker.setLongitude(workerMap.get("longitude") != null ? ((Number) workerMap.get("longitude")).doubleValue() : null);
            
            return worker;
        } catch (Exception e) {
            System.err.println("Error converting map to worker: " + e.getMessage());
            return null;
        }
    }

    // Utility methods
    private String extractWorkerName(String question) {
        // Simple extraction - look for patterns like "about [name]" or "worker [name]"
        String[] words = question.toLowerCase().split("\\s+");
        for (int i = 0; i < words.length - 1; i++) {
            if (words[i].equals("about") || words[i].equals("worker") || words[i].equals("named")) {
                return words[i + 1];
            }
        }
        return null;
    }

    private boolean isValidServiceField(String field) {
        if (field == null || field.trim().isEmpty()) {
            return false;
        }
        
        String[] platformFields = {"Electrician", "Plumber", "Carpenter", "Painter", 
                                 "Maid", "Chef", "Driver", "Photographer"};
        
        String normalizedField = field.trim();
        
        // Check exact match (case-insensitive)
        for (String validField : platformFields) {
            if (validField.equalsIgnoreCase(normalizedField)) {
                return true;
            }
        }
        
        // Check if the field can be extracted from the input using our field extraction logic
        String extractedField = extractFieldFromQuestion(field);
        return extractedField != null;
    }

    private String extractFieldFromQuestion(String question) {
        // Available fields in KajChai platform - exact match with frontend
        String[] platformFields = {"Electrician", "Plumber", "Carpenter", "Painter", 
                                 "Maid", "Chef", "Driver", "Photographer"};
        
        // Additional keywords that should map to platform fields
        String[][] fieldMappings = {
            {"electrician", "electric", "electrical", "wiring", "electricity"}, // -> Electrician
            {"plumber", "plumbing", "pipe", "water", "toilet", "sink", "faucet"}, // -> Plumber  
            {"carpenter", "carpentry", "wood", "furniture", "woodwork"}, // -> Carpenter
            {"painter", "painting", "paint", "wall painting", "house painting"}, // -> Painter
            {"maid", "cleaning", "cleaner", "housekeeping", "clean", "domestic help"}, // -> Maid
            {"chef", "cook", "cooking", "kitchen", "food", "meal preparation"}, // -> Chef
            {"driver", "driving", "transport", "car", "vehicle"}, // -> Driver
            {"photographer", "photography", "photo", "picture", "camera"} // -> Photographer
        };
        
        String lowerQuestion = question.toLowerCase();
        
        // Check for exact field name matches first
        for (String field : platformFields) {
            if (lowerQuestion.contains(field.toLowerCase())) {
                return field; // Return exact platform field name
            }
        }
        
        // Check for keyword mappings
        for (int i = 0; i < fieldMappings.length; i++) {
            String[] keywords = fieldMappings[i];
            for (String keyword : keywords) {
                if (lowerQuestion.contains(keyword)) {
                    return platformFields[i]; // Return corresponding platform field
                }
            }
        }
        
        return null;
    }

    private String callGroqAPI(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("max_tokens", 500);
            requestBody.put("temperature", 0.7);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> message = new HashMap<>();
            message.put("role", "user");
            message.put("content", prompt);
            messages.add(message);
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(groqApiUrl, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> choice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, String> messageResponse = (Map<String, String>) choice.get("message");
                    return messageResponse.get("content");
                }
            }

            return "I'm sorry, I couldn't process your request at the moment.";
            
        } catch (Exception e) {
            return "I'm experiencing technical difficulties. Please try again later.";
        }
    }
}