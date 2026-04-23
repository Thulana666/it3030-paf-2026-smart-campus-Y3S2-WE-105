package com.smartcampus.backend.service;

import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.ActivationRequestRepository;
import com.smartcampus.backend.repository.ResourceAssignmentRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class ActivationRequestService {

    @Autowired
    private ActivationRequestRepository activationRequestRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private ResourceAssignmentRepository assignmentRepository;

    public ActivationRequest createRequest(String resourceId, String assignmentId, String technicianId, String technicianName, String technicianEmail) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        ResourceAssignment assignment = null;
        if (assignmentId != null && !assignmentId.isBlank()) {
            assignment = assignmentRepository.findById(assignmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        }

        // Update resource to pending approval
        resource.setStatus(ResourceStatus.PENDING_APPROVAL);
        resourceRepository.save(resource);

        ActivationRequest req = new ActivationRequest();
        req.setResourceId(resource.getId());
        req.setResourceCode(resource.getResourceCode());
        req.setResourceName(resource.getName());
        req.setAssignmentId(assignmentId);
        req.setTechnicianId(technicianId);
        req.setTechnicianName(technicianName);
        req.setTechnicianEmail(technicianEmail);

        if (assignment != null) {
            req.setRepairNotes(assignment.getNotes());
            // best-effort completion date snapshot
            req.setRepairCompletedAt(assignment.getCompletedDate());
        }

        return activationRequestRepository.save(req);
    }

    public List<ActivationRequest> listAll() {
        return activationRequestRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(ActivationRequest::getCreatedAt).reversed())
                .toList();
    }

    public List<ActivationRequest> listPending() {
        return activationRequestRepository.findByStatus(ActivationRequestStatus.PENDING_APPROVAL)
                .stream()
                .sorted(Comparator.comparing(ActivationRequest::getCreatedAt).reversed())
                .toList();
    }

    public List<ActivationRequest> listByTechnician(String technicianId) {
        return activationRequestRepository.findByTechnicianId(technicianId)
                .stream()
                .sorted(Comparator.comparing(ActivationRequest::getCreatedAt).reversed())
                .toList();
    }

    public ActivationRequest approve(String requestId, String adminId, String adminEmail) {
        ActivationRequest req = activationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Activation request not found"));

        if (req.getStatus() != ActivationRequestStatus.PENDING_APPROVAL) {
            throw new IllegalArgumentException("Request is not pending approval");
        }

        Resource resource = resourceRepository.findById(req.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        resource.setStatus(ResourceStatus.ACTIVE);
        resourceRepository.save(resource);

        req.setStatus(ActivationRequestStatus.APPROVED);
        req.setDecidedAt(LocalDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setDecidedByAdminEmail(adminEmail);
        return activationRequestRepository.save(req);
    }

    public ActivationRequest reject(String requestId, String reason, String adminId, String adminEmail) {
        ActivationRequest req = activationRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Activation request not found"));

        if (req.getStatus() != ActivationRequestStatus.PENDING_APPROVAL) {
            throw new IllegalArgumentException("Request is not pending approval");
        }
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Reject reason is required");
        }

        Resource resource = resourceRepository.findById(req.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found"));

        resource.setStatus(ResourceStatus.UNDER_MAINTENANCE);
        resourceRepository.save(resource);

        req.setStatus(ActivationRequestStatus.REJECTED);
        req.setDecisionReason(reason.trim());
        req.setDecidedAt(LocalDateTime.now());
        req.setDecidedByAdminId(adminId);
        req.setDecidedByAdminEmail(adminEmail);
        return activationRequestRepository.save(req);
    }
}

