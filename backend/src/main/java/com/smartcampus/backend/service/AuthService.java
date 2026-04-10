package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.dto.LoginRequest;
import com.smartcampus.backend.dto.RegisterRequest;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtUtil;
import com.smartcampus.backend.exception.InvalidLoginMethodException;
import com.smartcampus.backend.model.Provider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Handles user registration and login.
 *
 * Register flow:
 *  1. Check email uniqueness → throw if duplicate
 *  2. Hash password with BCrypt
 *  3. Persist User document
 *  4. Generate JWT → return AuthResponse
 *
 * Login flow:
 *  1. Delegate credential verification to AuthenticationManager
 *     (throws BadCredentialsException automatically on failure)
 *  2. Load UserDetails → generate JWT → return AuthResponse
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    // -------------------------------------------------------
    // Register
    // -------------------------------------------------------

    public AuthResponse register(RegisterRequest request) {
        // Prevent duplicate accounts dynamically based on their origin
        userRepository.findByEmail(request.getEmail()).ifPresent(existingUser -> {
            if (existingUser.getProvider() == Provider.GOOGLE) {
                throw new InvalidLoginMethodException("This email is registered via Google. Please login using Google.");
            } else {
                throw new IllegalArgumentException("An account with email " + request.getEmail() + " already exists");
            }
        });

        // Default role to USER if not explicitly provided
        Role role = (request.getRole() != null) ? request.getRole() : Role.USER;

        // Build and save the user document
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))  // BCrypt hash
                .role(role)
                .provider(Provider.LOCAL)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // Load UserDetails so we can call JwtUtil.generateToken()
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .provider(user.getProvider())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    // -------------------------------------------------------
    // Login
    // -------------------------------------------------------

    public AuthResponse login(LoginRequest request) {
        // Intercept provider boundary crossing BEFORE hitting Spring Security
        User preflightUser = userRepository.findByEmail(request.getEmail())
                .orElse(null);
                
        if (preflightUser != null && preflightUser.getProvider() == Provider.GOOGLE) {
            throw new InvalidLoginMethodException("This account is registered via Google. Please login using Google.");
        }

        // This throws BadCredentialsException if credentials are wrong —
        // caught by GlobalExceptionHandler and returned as 401
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Credentials verified
        User user = preflightUser;
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .provider(user.getProvider())
                .profilePicture(user.getProfilePicture())
                .build();
    }
}
