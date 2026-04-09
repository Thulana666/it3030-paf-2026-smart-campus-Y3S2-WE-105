package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.AuthResponse;
import com.smartcampus.backend.dto.GoogleAuthRequest;
import com.smartcampus.backend.service.GoogleAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class GoogleAuthController {

    private final GoogleAuthService googleAuthService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleAuth(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(googleAuthService.authenticate(request.getToken()));
    }
}
