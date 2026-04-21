package com.smartcampus.backend.service;

import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAssignment;
import com.smartcampus.backend.model.User;
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
        Resource resource = resourceRepository.findById(resourceId)
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

    public ResourceAssignment updateAssignmentStatus(String assignmentId, String status) {
        ResourceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        assignment.setStatus(status);
        if ("COMPLETED".equals(status)) {
            assignment.setCompletedDate(LocalDateTime.now());
        }

        return assignmentRepository.save(assignment);
    }

    public ResourceAssignment updateAssignmentNotes(String assignmentId, String notes) {
        ResourceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));

        assignment.setNotes(notes);
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
