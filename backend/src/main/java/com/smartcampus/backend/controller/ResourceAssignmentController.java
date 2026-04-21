package com.smartcampus.backend.controller;

import com.smartcampus.backend.model.ResourceAssignment;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.dto.AssignResourceRequest;
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

    // Get all assignments for current technician
    @GetMapping("/my-assignments")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ResourceAssignment>> getMyAssignments(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(assignmentService.getTechnicianAssignments(currentUser.getId()));
    }

    // Get active assignments for current technician
    @GetMapping("/my-assignments/active")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ResourceAssignment>> getMyActiveAssignments(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(assignmentService.getActiveTechnicianAssignments(currentUser.getId()));
    }

    // Get in-progress assignments for current technician
    @GetMapping("/my-assignments/in-progress")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<List<ResourceAssignment>> getMyInProgressAssignments(Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(assignmentService.getInProgressAssignments(currentUser.getId()));
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

    // Update assignment status (TECHNICIAN and ADMIN)
    @PatchMapping("/{assignmentId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateStatus(@PathVariable String assignmentId, @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            if (status == null || status.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
            }
            ResourceAssignment updated = assignmentService.updateAssignmentStatus(assignmentId, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Update assignment notes (TECHNICIAN and ADMIN)
    @PatchMapping("/{assignmentId}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<?> updateNotes(@PathVariable String assignmentId, @RequestBody Map<String, String> request) {
        try {
            String notes = request.get("notes");
            ResourceAssignment updated = assignmentService.updateAssignmentNotes(assignmentId, notes);
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
