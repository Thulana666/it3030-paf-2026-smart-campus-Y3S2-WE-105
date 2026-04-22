package com.smartcampus.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Global CORS configuration for the Smart Campus Hub API.
 *
 * <p>Allows the Vite development server ({@code http://localhost:5173})
 * to make cross-origin requests to all {@code /api/**} endpoints.
 * In production this should be updated to the deployed frontend origin.</p>
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // ── Allowed origins ────────────────────────────────────────────────
        config.setAllowedOriginPatterns(List.of("*"));

        // ── Allowed methods ────────────────────────────────────────────────
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // ── Allowed headers ────────────────────────────────────────────────
        config.setAllowedHeaders(List.of("*"));

        // ── Expose Authorization header to frontend ─────────────────────
        config.setExposedHeaders(List.of("Authorization"));

        // ── Allow cookies / credentials (required for JWT in header) ───────
        config.setAllowCredentials(true);

        // ── Pre-flight cache: 1 hour ───────────────────────────────────────
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
