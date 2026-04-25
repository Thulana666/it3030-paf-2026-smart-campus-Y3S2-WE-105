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

@RestController
@RequestMapping("/api/technician/activation-requests")
@CrossOrigin(origins = "*")
public class TechnicianActivationRequestController {

    @Autowired
    private ActivationRequestService activationRequestService;

    @Autowired
    private UserRepository userRepository;

    private String resolveTechnicianId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(email);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ActivationRequest>> myRequests(Authentication authentication) {
        String techId = resolveTechnicianId(authentication);
        return ResponseEntity.ok(activationRequestService.listByTechnician(techId));
    }
}

