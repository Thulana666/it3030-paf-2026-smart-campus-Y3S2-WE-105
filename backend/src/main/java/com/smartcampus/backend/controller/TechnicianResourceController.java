package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.ActivationRequest;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.ActivationRequestService;
import com.smartcampus.backend.service.ResourceAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/technician/resources")
@CrossOrigin(origins = "*")
public class TechnicianResourceController {

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ActivationRequestService activationRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResourceAssignmentService resourceAssignmentService;

    private User resolveUser(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    // Mark repair completed for a resource (TECHNICIAN)
    // Body can include: assignmentId (optional)
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<?> completeRepair(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request
    ) {
        try {
            Resource resource = resourceRepository.findById(id).orElse(null);
            if (resource == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Resource not found"));
            }

            // Update resource status to repair completed
            resource.setStatus(ResourceStatus.REPAIR_COMPLETED);
            resourceRepository.save(resource);

            // Update the corresponding assignment if provided
            String assignmentId = request == null ? null : request.get("assignmentId");
            if (assignmentId != null && !assignmentId.isBlank()) {
                try {
                    resourceAssignmentService.updateRepairProgress(assignmentId, "COMPLETED", null);
                } catch (Exception e) {
                    // Log but don't fail the request if assignment update fails
                    System.err.println("Warning: Could not update assignment " + assignmentId + ": " + e.getMessage());
                }
            }

            return ResponseEntity.ok(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Request activation (TECHNICIAN)
    // Body: { assignmentId?: string }
    @PostMapping("/{id}/request-activation")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<?> requestActivation(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request,
            Authentication authentication
    ) {
        try {
            String assignmentId = request == null ? null : request.get("assignmentId");

            User user = resolveUser(authentication);
            String technicianId = user != null ? user.getId() : authentication.getName();
            String technicianName = user != null ? user.getName() : null;
            String technicianEmail = user != null ? user.getEmail() : authentication.getName();

            ActivationRequest created = activationRequestService.createRequest(
                    id,
                    assignmentId,
                    technicianId,
                    technicianName,
                    technicianEmail
            );

            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

