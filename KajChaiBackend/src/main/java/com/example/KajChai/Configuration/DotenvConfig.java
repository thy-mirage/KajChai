package com.example.KajChai.Configuration;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class to load environment variables from .env file
 */
@Configuration
public class DotenvConfig {

    @Bean
    public Dotenv dotenv() {
        return Dotenv.configure()
                .directory("./")  // Look for .env in the root directory of the backend
                .ignoreIfMissing() // Don't fail if .env is missing (for production)
                .load();
    }
    
    static {
        // Load .env file early in the application lifecycle
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")
                    .ignoreIfMissing()
                    .load();
            
            // Set system properties from .env file
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            System.out.println("Warning: Could not load .env file: " + e.getMessage());
        }
    }
}