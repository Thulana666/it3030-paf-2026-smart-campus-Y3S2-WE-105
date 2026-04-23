package com.smartcampus.backend.service;

import com.smartcampus.backend.model.ResourceAssignment;
import com.smartcampus.backend.repository.ResourceAssignmentRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResourceAssignmentService {

    @Autowired
    private ResourceAssignmentRepository assignmentRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    public ResourceAssignment assignResourceToTechnician(String resourceId, String technicianId, 
                                                       String technicianName, String technicianEmail,
                                                       String issueType, String description, 
                                                       String priority, LocalDateTime dueDate) {
        // Verify resource exists
        resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        ResourceAssignment assignment = new ResourceAssignment(
                resourceId, technicianId, technicianName, technicianEmail, issueType, description, priority
        );
        assignment.setDueDate(dueDate);
        
        return assignmentRepository.save(assignment);
    }

    public List<ResourceAssignment> getTechnicianAssignments(String technicianId) {
        return assignmentRepository.findByTechnicianId(technicianId);
    }

    public List<ResourceAssignment> getActiveTechnicianAssignments(String technicianId) {
        return assignmentRepository.findByTechnicianIdAndStatus(technicianId, "ASSIGNED")
                .stream()
                .collect(Collectors.toList());
    }

    public List<ResourceAssignment> getInProgressAssignments(String technicianId) {
        return assignmentRepository.findByTechnicianIdAndStatus(technicianId, "IN_PROGRESS");
    }

    public List<ResourceAssignment> getResourceAssignments(String resourceId) {
        return assignmentRepository.findByResourceId(resourceId);
    }

    private String mapProgressToAssignmentStatus(String progressStatus) {
        if (progressStatus == null) return null;
        if ("COMPLETED".equalsIgnoreCase(progressStatus)) return "COMPLETED";
        return "IN_PROGRESS";
    }

    public ResourceAssignment updateRepairProgress(String assignmentId, String progressStatus, String notes) {
        ResourceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        boolean updated = false;
        
        if (progressStatus != null && !progressStatus.isBlank()) {
            assignment.setProgressStatus(progressStatus);
            String backendStatus = mapProgressToAssignmentStatus(progressStatus);
            if (backendStatus != null) {
                assignment.setStatus(backendStatus);
                if ("COMPLETED".equals(backendStatus)) {
                    assignment.setCompletedDate(LocalDateTime.now());
                }
            }
            updated = true;
        }

        if (notes != null && !notes.isBlank()) {
            assignment.setNotes(notes);
            updated = true;
        }

        if (updated) {
            assignment.setUpdatedAt(LocalDateTime.now());
        }

        return assignmentRepository.save(assignment);
    }

    public ResourceAssignment appendRepairNote(String assignmentId, String note) {
        ResourceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        String trimmed = note == null ? "" : note.trim();
        if (trimmed.isEmpty()) {
            return assignment;
        }

        String existing = assignment.getNotes();
        if (existing == null || existing.trim().isEmpty()) {
            assignment.setNotes(trimmed);
        } else {
            assignment.setNotes((existing.trim() + "\n" + trimmed).trim());
        }
        assignment.setUpdatedAt(LocalDateTime.now());

        return assignmentRepository.save(assignment);
    }

    public void deleteAssignment(String assignmentId) {
        assignmentRepository.deleteById(assignmentId);
    }

    public List<ResourceAssignment> getAssignmentsByStatus(String status) {
        return assignmentRepository.findByStatus(status);
    }
}
