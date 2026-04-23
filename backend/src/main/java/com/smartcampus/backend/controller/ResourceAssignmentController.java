package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.ResourceAssignment;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.dto.AssignResourceRequest;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.service.ResourceAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class ResourceAssignmentController {

    @Autowired
    private ResourceAssignmentService assignmentService;

    @Autowired
    private UserRepository userRepository;

    private String resolveTechnicianId(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(email);
    }

    // Get all assignments for current technician
    @GetMapping("/my-assignments")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ResourceAssignment>> getMyAssignments(Authentication authentication) {
        String technicianId = resolveTechnicianId(authentication);
        return ResponseEntity.ok(assignmentService.getTechnicianAssignments(technicianId));
    }

    // Get active assignments for current technician
    @GetMapping("/my-assignments/active")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ResourceAssignment>> getMyActiveAssignments(Authentication authentication) {
        String technicianId = resolveTechnicianId(authentication);
        return ResponseEntity.ok(assignmentService.getActiveTechnicianAssignments(technicianId));
    }

    // Get in-progress assignments for current technician
    @GetMapping("/my-assignments/in-progress")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ResourceAssignment>> getMyInProgressAssignments(Authentication authentication) {
        String technicianId = resolveTechnicianId(authentication);
        return ResponseEntity.ok(assignmentService.getInProgressAssignments(technicianId));
    }

    // Get all assignments for a specific technician (ADMIN only)
    @GetMapping("/technician/{technicianId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResourceAssignment>> getTechnicianAssignments(@PathVariable String technicianId) {
        return ResponseEntity.ok(assignmentService.getTechnicianAssignments(technicianId));
    }

    // Get all assignments for a resource
    @GetMapping("/resource/{resourceId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<ResourceAssignment>> getResourceAssignments(@PathVariable String resourceId) {
        return ResponseEntity.ok(assignmentService.getResourceAssignments(resourceId));
    }

    // Assign resource to technician (ADMIN only)
    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignResource(@RequestBody AssignResourceRequest request) {
        try {
            ResourceAssignment assignment = assignmentService.assignResourceToTechnician(
                    request.getResourceId(),
                    request.getTechnicianId(),
                    request.getTechnicianName(),
                    request.getTechnicianEmail(),
                    request.getIssueType(),
                    request.getDescription(),
                    request.getPriority(),
                    request.getDueDate()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Update repair progress + optionally replace notes (TECHNICIAN and ADMIN)
    @PatchMapping("/{assignmentId}/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateRepairProgress(
            @PathVariable String assignmentId,
            @RequestBody Map<String, String> request
    ) {
        try {
            String progressStatus = request.get("progressStatus");
            String notes = request.get("notes"); // full notes replacement (optional)
            ResourceAssignment updated = assignmentService.updateRepairProgress(assignmentId, progressStatus, notes);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Append a single repair note line (TECHNICIAN and ADMIN)
    @PatchMapping("/{assignmentId}/notes/append")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> appendRepairNote(
            @PathVariable String assignmentId,
            @RequestBody Map<String, String> request
    ) {
        try {
            String note = request.get("note");
            if (note == null || note.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Note is required"));
            }
            ResourceAssignment updated = assignmentService.appendRepairNote(assignmentId, note);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Delete assignment (ADMIN only)
    @DeleteMapping("/{assignmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAssignment(@PathVariable String assignmentId) {
        try {
            assignmentService.deleteAssignment(assignmentId);
            return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get assignments by status (ADMIN only)
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResourceAssignment>> getAssignmentsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByStatus(status));
    }
}
