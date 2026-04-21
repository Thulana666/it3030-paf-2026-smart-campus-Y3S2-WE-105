package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    private String title;
    private String description;
    private String category;
    private String contactDetails;

    private TicketPriority priority;
    private TicketStatus status;

    private String createdBy;     // User ID who created the ticket
    private String assignedTo;    // Technician ID assigned to the ticket
    
    private String resourceId;    // E.g., Room ID or Asset ID
    
    private List<String> imagePaths; // Paths to uploaded images (max 3)

    private String resolutionNotes;
    private String rejectionReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
