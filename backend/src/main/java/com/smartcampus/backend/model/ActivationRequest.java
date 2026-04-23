package com.smartcampus.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "activation_requests")
public class ActivationRequest {
    @Id
    private String id;

    private String resourceId;
    private String resourceCode;
    private String resourceName;

    private String assignmentId;

    private String technicianId;
    private String technicianName;
    private String technicianEmail;

    // Snapshot of notes at request time (optional)
    private String repairNotes;
    private LocalDateTime repairCompletedAt;

    private ActivationRequestStatus status; // PENDING_APPROVAL, APPROVED, REJECTED
    private String decisionReason;          // required for REJECTED
    private String decidedByAdminId;
    private String decidedByAdminEmail;
    private LocalDateTime decidedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ActivationRequest() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.status = ActivationRequestStatus.PENDING_APPROVAL;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceCode() {
        return resourceCode;
    }

    public void setResourceCode(String resourceCode) {
        this.resourceCode = resourceCode;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
    }

    public String getTechnicianId() {
        return technicianId;
    }

    public void setTechnicianId(String technicianId) {
        this.technicianId = technicianId;
    }

    public String getTechnicianName() {
        return technicianName;
    }

    public void setTechnicianName(String technicianName) {
        this.technicianName = technicianName;
    }

    public String getTechnicianEmail() {
        return technicianEmail;
    }

    public void setTechnicianEmail(String technicianEmail) {
        this.technicianEmail = technicianEmail;
    }

    public String getRepairNotes() {
        return repairNotes;
    }

    public void setRepairNotes(String repairNotes) {
        this.repairNotes = repairNotes;
    }

    public LocalDateTime getRepairCompletedAt() {
        return repairCompletedAt;
    }

    public void setRepairCompletedAt(LocalDateTime repairCompletedAt) {
        this.repairCompletedAt = repairCompletedAt;
    }

    public ActivationRequestStatus getStatus() {
        return status;
    }

    public void setStatus(ActivationRequestStatus status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getDecisionReason() {
        return decisionReason;
    }

    public void setDecisionReason(String decisionReason) {
        this.decisionReason = decisionReason;
        this.updatedAt = LocalDateTime.now();
    }

    public String getDecidedByAdminId() {
        return decidedByAdminId;
    }

    public void setDecidedByAdminId(String decidedByAdminId) {
        this.decidedByAdminId = decidedByAdminId;
    }

    public String getDecidedByAdminEmail() {
        return decidedByAdminEmail;
    }

    public void setDecidedByAdminEmail(String decidedByAdminEmail) {
        this.decidedByAdminEmail = decidedByAdminEmail;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

