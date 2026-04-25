package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.ActivationRequest;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.ActivationRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/activation-requests")
@CrossOrigin(origins = "*")
public class AdminActivationRequestController {

    @Autowired
    private ActivationRequestService activationRequestService;

    @Autowired
    private UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ActivationRequest>> listAll() {
        return ResponseEntity.ok(activationRequestService.listAll());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ActivationRequest>> listPending() {
        return ResponseEntity.ok(activationRequestService.listPending());
    }

    @PatchMapping("/{requestId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approve(@PathVariable String requestId, Authentication authentication) {
        try {
            User admin = resolveUser(authentication);
            String adminId = admin != null ? admin.getId() : null;
            String adminEmail = admin != null ? admin.getEmail() : authentication.getName();
            return ResponseEntity.ok(activationRequestService.approve(requestId, adminId, adminEmail));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{requestId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reject(
            @PathVariable String requestId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        try {
            String reason = body.get("reason");
            User admin = resolveUser(authentication);
            String adminId = admin != null ? admin.getId() : null;
            String adminEmail = admin != null ? admin.getEmail() : authentication.getName();
            return ResponseEntity.ok(activationRequestService.reject(requestId, reason, adminId, adminEmail));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

