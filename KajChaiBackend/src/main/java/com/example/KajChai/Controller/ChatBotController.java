package com.example.KajChai.Controller;

import com.example.KajChai.Service.ChatBotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = {
    "http://localhost:5173", 
    "http://localhost:5174", 
    "https://kaj-chai.vercel.app",
    "https://*.vercel.app"
}, allowCredentials = "true")
public class ChatBotController {

    @Autowired
    private ChatBotService chatBotService;

    @PostMapping("/ask")
    public ResponseEntity<?> askQuestion(@RequestBody ChatBotRequest request) {
        try {
            // Validate request
            if (request.getQuestion() == null || request.getQuestion().trim().isEmpty()) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "Question cannot be empty");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Process the question through the chatbot service
            ChatBotResponse response = chatBotService.processQuestion(
                request.getQuestion(),
                request.getUserId(),
                null, // userLocation - now automatically detected
                null  // userField - now automatically detected  
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An error occurred while processing your question: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/follow-up")
    public ResponseEntity<?> handleFollowUp(@RequestBody FollowUpRequest request) {
        try {
            ChatBotResponse response = chatBotService.handleFollowUp(
                request.getOriginalQuestion(),
                request.getFollowUpResponse(),
                request.getConversationContext(),
                request.getUserId(),
                request.getUserLocation(),
                request.getUserField()
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An error occurred while processing your follow-up: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    // Request DTOs
    public static class ChatBotRequest {
        private String question;
        private Long userId;
        private String userLocation;
        private String userField;

        // Constructors
        public ChatBotRequest() {}

        public ChatBotRequest(String question, Long userId, String userLocation, String userField) {
            this.question = question;
            this.userId = userId;
            this.userLocation = userLocation;
            this.userField = userField;
        }

        // Getters and Setters
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUserLocation() { return userLocation; }
        public void setUserLocation(String userLocation) { this.userLocation = userLocation; }

        public String getUserField() { return userField; }
        public void setUserField(String userField) { this.userField = userField; }
    }

    public static class FollowUpRequest {
        private String originalQuestion;
        private String followUpResponse;
        private Map<String, Object> conversationContext;
        private Long userId;
        private String userLocation;
        private String userField;

        // Constructors
        public FollowUpRequest() {}

        // Getters and Setters
        public String getOriginalQuestion() { return originalQuestion; }
        public void setOriginalQuestion(String originalQuestion) { this.originalQuestion = originalQuestion; }

        public String getFollowUpResponse() { return followUpResponse; }
        public void setFollowUpResponse(String followUpResponse) { this.followUpResponse = followUpResponse; }

        public Map<String, Object> getConversationContext() { return conversationContext; }
        public void setConversationContext(Map<String, Object> conversationContext) { this.conversationContext = conversationContext; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUserLocation() { return userLocation; }
        public void setUserLocation(String userLocation) { this.userLocation = userLocation; }

        public String getUserField() { return userField; }
        public void setUserField(String userField) { this.userField = userField; }
    }

    // Response DTO
    public static class ChatBotResponse {
        private String response;
        private String category;
        private boolean needsFollowUp;
        private String followUpPrompt;
        private Map<String, Object> additionalData;
        private Map<String, Object> conversationContext;

        // Constructors
        public ChatBotResponse() {}

        public ChatBotResponse(String response, String category) {
            this.response = response;
            this.category = category;
            this.needsFollowUp = false;
        }

        // Getters and Setters
        public String getResponse() { return response; }
        public void setResponse(String response) { this.response = response; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public boolean isNeedsFollowUp() { return needsFollowUp; }
        public void setNeedsFollowUp(boolean needsFollowUp) { this.needsFollowUp = needsFollowUp; }

        public String getFollowUpPrompt() { return followUpPrompt; }
        public void setFollowUpPrompt(String followUpPrompt) { this.followUpPrompt = followUpPrompt; }

        public Map<String, Object> getAdditionalData() { return additionalData; }
        public void setAdditionalData(Map<String, Object> additionalData) { this.additionalData = additionalData; }

        public Map<String, Object> getConversationContext() { return conversationContext; }
        public void setConversationContext(Map<String, Object> conversationContext) { this.conversationContext = conversationContext; }
    }
}