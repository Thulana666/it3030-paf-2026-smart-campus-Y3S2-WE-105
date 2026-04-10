package com.smartcampus.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.model.Provider;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.JwtUtil;
import com.smartcampus.backend.exception.InvalidLoginMethodException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

@Service
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final String googleClientId;

    public GoogleAuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            UserDetailsService userDetailsService,
            @Value("${google.client.id}") String googleClientId) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.googleClientId = googleClientId;
    }

    public AuthResponse authenticate(String idTokenString) {
        try {
            // Verify token cryptographically against Google's public keys
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid or expired Google ID token.");
            }

            // Extract verified federated identities
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            // Look up or seamlessly provision user
            Optional<User> userOptional = userRepository.findByEmail(email);
            User user;

            if (userOptional.isPresent()) {
                user = userOptional.get();
                if (user.getProvider() == Provider.LOCAL) {
                    throw new InvalidLoginMethodException("This email is registered with a password. Please login using your email and password.");
                }
                
                // Only update profile picture if they don't have one
                if (user.getProfilePicture() == null && picture != null) {
                    user.setProfilePicture(picture);
                    user = userRepository.save(user);
                }
            } else {
                user = User.builder()
                        .name(name)
                        .email(email)
                        .profilePicture(picture)
                        .role(Role.USER)
                        .provider(Provider.GOOGLE)
                        .createdAt(LocalDateTime.now())
                        // Password explicitly left completely absent
                        .build();
                user = userRepository.save(user);
            }

            // Issue internal JWT mimicking standard login flow
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

        } catch (InvalidLoginMethodException e) {
            throw e; // Let our GlobalExceptionHandler catch this directly
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed or expired: " + e.getMessage(), e);
        }
    }
}
