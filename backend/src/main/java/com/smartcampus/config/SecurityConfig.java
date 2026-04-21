package com.smartcampus.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Configure CORS so React (Port 5173) is allowed to talk to Spring Boot (Port 8080)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 2. Disable CSRF because we are building a stateless REST API
            .csrf(csrf -> csrf.disable())
            
            // 3. Disable Sessions (We will use JSON Web Tokens later)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 4. THE RULES: What is public and what is locked?
            .authorizeHttpRequests(auth -> auth
                // Anyone can view the resources (GET requests)
                .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()
                // Anyone can access the login endpoints (we will build this next)
                .requestMatchers("/api/auth/**").permitAll()
                // EVERYTHING ELSE (POST, PUT, DELETE) requires a secure login token!
                .anyRequest().authenticated()
            );

        return http.build();
    }

    // CORS Configuration details
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}