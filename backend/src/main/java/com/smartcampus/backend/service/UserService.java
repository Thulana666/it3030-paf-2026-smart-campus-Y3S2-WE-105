package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.dto.PasswordChangeRequest;
import com.smartcampus.backend.dto.ProfileUpdateRequest;
import com.smartcampus.backend.dto.RegisterRequest;
import com.smartcampus.backend.model.Provider;
import com.smartcampus.backend.model.Role;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Secures database update targeting only permitted mutable domains.
     * Prevents clients from escalating role or swapping providers locally.
     */
    public AuthResponse updateProfile(String authenticatedEmail, ProfileUpdateRequest request) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user record not found in persistence layer."));
                
        user.setName(request.getName());
        user.setProfilePicture(request.getProfilePicture());
        
        user = userRepository.save(user);

        // Echo the same structure standard authentications do so the UI hydrates instantly
        return AuthResponse.builder()
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .provider(user.getProvider())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    /**
     * Authenticates existing credentials before allowing a password swap.
     * Only permitted for 'local' accounts.
     */
    public void changePassword(String email, PasswordChangeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (user.getProvider() != null && user.getProvider() != Provider.LOCAL) {
            throw new IllegalStateException("Password cannot be changed for " + user.getProvider() + " accounts.");
        }

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Retrieves all registered users in the system.
     * Intended for administrative oversight only.
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Administratively creates a new user account with an explicit role.
     */
    public User createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("An account with email " + request.getEmail() + " already exists.");
        }

        Role role = (request.getRole() != null) ? request.getRole() : Role.USER;

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .provider(Provider.LOCAL)
                .createdAt(LocalDateTime.now())
                .build();

        return userRepository.save(user);
    }

    /**
     * Permanently removes a user account by their database ID.
     */
    public void deleteUser(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User with ID " + userId + " not found.");
        }
        userRepository.deleteById(userId);
    }

    /**
     * Updates the role of a user by their database ID.
     * Only permitted for admin operations.
     */
    public User updateUserRole(String userId, Role newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User with ID " + userId + " not found."));
        user.setRole(newRole);
        return userRepository.save(user);
    }
}
