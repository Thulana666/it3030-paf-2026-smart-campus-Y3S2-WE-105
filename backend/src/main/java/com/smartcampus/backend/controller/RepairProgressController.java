package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.RepairProgressRecord;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.RepairProgressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/repair-progress")
@CrossOrigin(origins = "*")
public class RepairProgressController {

    private String clean(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safeErrorMessage(Exception e) {
        if (e == null) return "Unknown error";
        if (e.getMessage() != null && !e.getMessage().isBlank()) {
            return e.getMessage();
        }
        return e.getClass().getSimpleName();
    }

    @Autowired
    private RepairProgressService repairProgressService;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private UserRepository userRepository;

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<RepairProgressRecord>> getAllRepairProgress() {
        return ResponseEntity.ok(repairProgressService.getAllRepairProgress());
    }

    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<RepairProgressRecord>> getRepairProgressByResource(@PathVariable String resourceId) {
        return ResponseEntity.ok(repairProgressService.getRepairProgressByResource(resourceId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> createRepairProgress(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        try {
            String resourceId = clean(request.get("resourceId"));
            String resourceName = clean(request.get("resourceName"));
            String resourceCode = clean(request.get("resourceCode"));
            String progressStatus = clean(request.get("progressStatus"));
            String repairNotes = clean(request.get("repairNotes"));

            if (progressStatus == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Progress status is required"));
            }

            if (resourceName == null && resourceCode == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Resource name or code is required"));
            }

            if (resourceId == null && resourceCode != null) {
                Resource resource = resourceRepository.findByResourceCode(resourceCode).orElse(null);
                if (resource != null) {
                    resourceId = resource.getId();
                    resourceName = resourceName == null ? resource.getName() : resourceName;
                    resourceCode = resource.getResourceCode();
                }
            }

            User user = resolveUser(authentication);
            String technicianId = user != null ? user.getId() : authentication.getName();
            String technicianName = user != null ? user.getName() : authentication.getName();
            String technicianEmail = user != null ? user.getEmail() : authentication.getName();

            RepairProgressRecord created = repairProgressService.createRepairProgress(
                    resourceId,
                    resourceName,
                    resourceCode,
                    progressStatus,
                    repairNotes,
                    technicianId,
                    technicianName,
                    technicianEmail
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", safeErrorMessage(e)));
        } catch (Exception e) {
            System.err.println("Error creating repair progress: " + safeErrorMessage(e));
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", safeErrorMessage(e)));
        }
    }
}