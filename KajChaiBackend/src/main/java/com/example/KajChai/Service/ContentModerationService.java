package com.example.KajChai.Service;

import com.example.KajChai.DTO.ModerationResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContentModerationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String groqModel;

    public ModerationResult analyzeContent(String title, String content) {
        try {
            log.info("Starting content moderation for title: {}", title);
            
            String prompt = buildModerationPrompt(title, content);
            String response = callGroqAPI(prompt);
            
            return parseResponse(response);
            
        } catch (Exception e) {
            log.error("Error in content moderation: ", e);
            // Fallback: if API fails, mark as pending for manual review instead of auto-approving
            return ModerationResult.builder()
                    .isSpam(false)
                    .isRelevant(false) // Mark as not relevant to trigger manual review
                    .confidenceScore(0.0)
                    .reason("API error - requires manual review: " + e.getMessage())
                    .action("REJECT_IRRELEVANT") // This will require admin to manually approve
                    .build();
        }
    }

    private String callGroqAPI(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(groqApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = Map.of(
                "messages", List.of(
                        Map.of("role", "system", "content", getSystemPrompt()),
                        Map.of("role", "user", "content", prompt)
                ),
                "model", groqModel,
                "temperature", 0.1,
                "max_tokens", 300
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(groqApiUrl, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                return jsonResponse.path("choices").get(0).path("message").path("content").asText();
            } else {
                throw new RuntimeException("Invalid response from Groq API");
            }
            
        } catch (Exception e) {
            log.error("Error calling Groq API: ", e);
            throw new RuntimeException("Failed to call Groq API", e);
        }
    }

    private String getSystemPrompt() {
        return """
                You are a content moderator for KajChai, a platform connecting customers 
                with service workers ('Electrician',
                                        'Plumber',
                                        'Carpenter',
                                        'Painter',
                                        'Maid',
                                        'Chef',
                                        'Driver',
                                        'Photographer' etc.) in Bangladesh.
                
                Analyze posts for:
                1. SPAM: Promotional content for unrelated products, irrelevant links, repetitive posting
                2. RELEVANCE: Must be related to home services, repairs, maintenance, worker-customer interactions, complaints about worker, any problems regarding home services
                3. APPROPRIATENESS: No offensive, harmful, or inappropriate content
                
                RELEVANT topics include:
                - Home repair issues and solutions
                - Service provider recommendations or complaints
                - Pricing discussions for repairs/services
                - Quality of work experiences
                - Technical help requests (electrical, plumbing, etc.)
                - Tool/equipment discussions
                - General home maintenance questions
                - Worker availability or service requests
                
                IRRELEVANT topics include:
                - Selling unrelated products (food, clothes, electronics not for repair)
                - Political discussions
                - Personal relationships not related to work
                - Medical advice
                - Financial services unrelated to home services
                
                Respond ONLY in this JSON format (no extra text):
                {
                    "is_spam": boolean,
                    "is_relevant": boolean,
                    "confidence_score": 0.0-1.0,
                    "reason": "brief explanation",
                    "action": "APPROVE|REJECT_SPAM|REJECT_IRRELEVANT"
                }
                """;
    }

    private String buildModerationPrompt(String title, String content) {
        return String.format("""
                Analyze this forum post for spam and relevance:
                
                TITLE: %s
                CONTENT: %s
                
                Determine if this post is appropriate for a home services platform in Bangladesh.
                """, title, content);
    }

    private ModerationResult parseResponse(String response) {
        try {
            // Extract JSON from response using regex
            Pattern jsonPattern = Pattern.compile("\\{[^{}]*\\}");
            Matcher matcher = jsonPattern.matcher(response);
            
            String jsonResponse = response;
            if (matcher.find()) {
                jsonResponse = matcher.group();
            }
            
            log.info("Parsing moderation response: {}", jsonResponse);
            
            JsonNode jsonNode = objectMapper.readTree(jsonResponse);
            
            boolean isSpam = jsonNode.path("is_spam").asBoolean();
            boolean isRelevant = jsonNode.path("is_relevant").asBoolean();
            double confidenceScore = jsonNode.path("confidence_score").asDouble();
            String reason = jsonNode.path("reason").asText();
            String action = jsonNode.path("action").asText();
            
            return ModerationResult.builder()
                    .isSpam(isSpam)
                    .isRelevant(isRelevant)
                    .confidenceScore(confidenceScore)
                    .reason(reason)
                    .action(action)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error parsing moderation response: {}", response, e);
            // Fallback response - mark for manual review instead of auto-approving
            return ModerationResult.builder()
                    .isSpam(false)
                    .isRelevant(false) // Mark as not relevant to trigger manual review
                    .confidenceScore(0.0)
                    .reason("Failed to parse AI response - requires manual review")
                    .action("REJECT_IRRELEVANT")
                    .build();
        }
    }
}