package com.smartcampus.backend.config;
import com.smartcampus.backend.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration:
 *  - Disables CSRF (stateless REST API)
 *  - Disables default form login page
 *  - Configures STATELESS session management (no HttpSession)
 *  - Defines role-based access rules for endpoints
 *  - Registers JwtAuthFilter before the standard username/password filter
 *  - Provides BCrypt password encoder
 *
 * Role mapping:
 *  - /api/auth/**          → PUBLIC (register & login)
 *  - /api/notifications/** → Any authenticated user
 *  - /api/admin/**         → ADMIN only
 *  - /api/technician/**    → TECHNICIAN only
 *  - Everything else       → Authenticated users
 *
 * Note: DaoAuthenticationProvider is intentionally NOT declared as a @Bean here.
 * Spring Boot auto-configures it via UserDetailsService + PasswordEncoder beans.
 * This avoids deprecation warnings introduced in Spring Security 6.4+.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity           // Enables @PreAuthorize at method level
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // -------------------------------------------------------
    // Security filter chain — core HTTP security rules
    // -------------------------------------------------------

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF — not needed for stateless JWT REST APIs
            .csrf(AbstractHttpConfigurer::disable)

            // Disable default Spring Security login form
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            // Stateless session — no server-side session is created or used
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Authorization rules
            .authorizeHttpRequests(auth -> auth

                // Auth endpoints are fully public
                .requestMatchers("/api/auth/**").permitAll()

                // Notification endpoints require any authenticated user
                .requestMatchers("/api/notifications/**").authenticated()

                // Admin-only operations
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Technician-only operations
                .requestMatchers("/api/technician/**").hasRole("TECHNICIAN")

                // All other requests require authentication
                .anyRequest().authenticated()
            )

            // Register JWT filter before the standard username/password filter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // -------------------------------------------------------
    // Beans
    // -------------------------------------------------------

    /**
     * BCrypt password encoder with default strength (10 rounds).
     * Spring Security auto-discovers this bean and wires it into
     * the DaoAuthenticationProvider automatically.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Exposes the AuthenticationManager bean so AuthService can
     * delegate credential verification to Spring Security.
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
