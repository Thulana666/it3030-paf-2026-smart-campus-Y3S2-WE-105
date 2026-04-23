package com.smartcampus.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Document(collection = "resource_assignments")
public class ResourceAssignment {
    @Id
    private String id;
    
    private String resourceId;
    
    @Indexed
    private String technicianId;
    
    private String technicianName;
    
    private String technicianEmail;
    
    private String issueType; // e.g., "Hardware Repair", "Maintenance", "Inspection"
    
    private String description;
    
    private String priority; // LOW, MEDIUM, HIGH, CRITICAL
    
    private String status; // ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED

    // Technician-facing repair progress status (INSPECTING, PARTS_ORDERED, IN_PROGRESS, WAITING_APPROVAL, COMPLETED)
    private String progressStatus;
    
    private LocalDateTime assignedDate;
    
    private LocalDateTime dueDate;
    
    private LocalDateTime completedDate;
    
    private String notes;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    // Constructors
    public ResourceAssignment() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.assignedDate = LocalDateTime.now();
        this.status = "ASSIGNED";
    }

    public ResourceAssignment(String resourceId, String technicianId, String technicianName, 
                             String technicianEmail, String issueType, String description, String priority) {
        this();
        this.resourceId = resourceId;
        this.technicianId = technicianId;
        this.technicianName = technicianName;
        this.technicianEmail = technicianEmail;
        this.issueType = issueType;
        this.description = description;
        this.priority = priority;
    }

    // Getters and Setters
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

    public String getIssueType() {
        return issueType;
    }

    public void setIssueType(String issueType) {
        this.issueType = issueType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }

    public String getProgressStatus() {
        return progressStatus;
    }

    public void setProgressStatus(String progressStatus) {
        this.progressStatus = progressStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public LocalDateTime getAssignedDate() {
        return assignedDate;
    }

    public void setAssignedDate(LocalDateTime assignedDate) {
        this.assignedDate = assignedDate;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDateTime getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDateTime completedDate) {
        this.completedDate = completedDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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
