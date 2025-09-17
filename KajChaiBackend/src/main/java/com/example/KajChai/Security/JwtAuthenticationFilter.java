package com.example.KajChai.Security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.KajChai.Service.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        
        // Try to get JWT from header first, then from cookie
        String jwt = extractJwtFromHeader(request);
        if (jwt == null) {
            jwt = extractJwtFromCookie(request);
        }
        
        String username = null;

        if (jwt != null) {
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                // JWT token has expired
                logger.warn("JWT token has expired: " + e.getMessage());
                request.setAttribute("jwt_error", "JWT token has expired");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"JWT token has expired\",\"message\":\"Please login again\"}");
                response.setContentType("application/json");
                return;
            } catch (io.jsonwebtoken.MalformedJwtException e) {
                // JWT token is malformed
                logger.warn("Malformed JWT token: " + e.getMessage());
                request.setAttribute("jwt_error", "Invalid JWT token");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Invalid JWT token\",\"message\":\"Malformed token\"}");
                response.setContentType("application/json");
                return;
            } catch (io.jsonwebtoken.security.SecurityException e) {
                // JWT signature validation failed
                logger.warn("JWT signature validation failed: " + e.getMessage());
                request.setAttribute("jwt_error", "Invalid JWT token");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Invalid JWT token\",\"message\":\"Signature validation failed\"}");
                response.setContentType("application/json");
                return;
            } catch (Exception e) {
                // Other JWT related errors
                logger.warn("Invalid JWT token: " + e.getMessage());
                request.setAttribute("jwt_error", "Invalid JWT token");
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Invalid JWT token\",\"message\":\"Token validation failed\"}");
                response.setContentType("application/json");
                return;
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromHeader(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private String extractJwtFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
