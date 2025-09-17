package com.example.KajChai.Security;

import java.io.IOException;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        
        // Check if this is a JWT-related error
        String error = (String) request.getAttribute("jwt_error");
        
        response.setContentType("application/json");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        if (error != null) {
            response.getWriter().write("{\"error\":\"" + error + "\",\"message\":\"Authentication failed\"}");
        } else {
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Authentication is required to access this resource\"}");
        }
    }
}