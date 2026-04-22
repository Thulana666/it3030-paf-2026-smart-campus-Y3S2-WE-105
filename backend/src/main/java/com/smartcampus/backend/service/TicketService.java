package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.CommentRequest;
import com.smartcampus.backend.dto.CommentResponse;
import com.smartcampus.backend.dto.TicketCreateRequest;
import com.smartcampus.backend.dto.TicketResponse;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.repository.TicketCommentRepository;
import com.smartcampus.backend.repository.TicketRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;

    // --- USER METHODS ---

    public TicketResponse createTicket(TicketCreateRequest request, List<MultipartFile> images, String userId) {
        List<String> imagePaths = new ArrayList<>();
        if (images != null) {
            if (images.size() > 3) {
                throw new IllegalArgumentException("Maximum 3 images allowed.");
            }
            for (MultipartFile file : images) {
                if (!file.isEmpty()) {
                    imagePaths.add(fileStorageService.storeFile(file));
                }
            }
        }

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .contactDetails(request.getContactDetails())
                .priority(request.getPriority())
                .status(TicketStatus.OPEN)
                .createdBy(userId)
                .resourceId(request.getResourceId())
                .imagePaths(imagePaths)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        // Notify Admins
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    "New ticket created: " + ticket.getTitle(),
                    NotificationType.TICKET
            );
        }

        return TicketResponse.from(savedTicket);
    }

    public List<TicketResponse> getMyTickets(String userId) {
        return ticketRepository.findByCreatedByOrderByCreatedAtDesc(userId)
                .stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    public TicketResponse updateTicket(String ticketId, TicketCreateRequest request, String userId) {
        Ticket ticket = getTicketById(ticketId);

        if (!ticket.getCreatedBy().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only edit your own tickets");
        }
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new IllegalStateException("Only OPEN tickets can be edited");
        }

        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setContactDetails(request.getContactDetails());
        ticket.setPriority(request.getPriority());
        ticket.setResourceId(request.getResourceId());
        ticket.setUpdatedAt(LocalDateTime.now());

        return TicketResponse.from(ticketRepository.save(ticket));
    }

    public void deleteTicket(String ticketId, String userId) {
        Ticket ticket = getTicketById(ticketId);

        if (!ticket.getCreatedBy().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only delete your own tickets");
        }
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new IllegalStateException("Only OPEN tickets can be deleted");
        }

        ticketRepository.delete(ticket);
    }

    public CommentResponse addComment(String ticketId, CommentRequest request, String userId) {
        Ticket ticket = getTicketById(ticketId);

        TicketComment comment = TicketComment.builder()
                .ticketId(ticketId)
                .authorId(userId)
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .build();

        TicketComment savedComment = commentRepository.save(comment);

        // Notify relevant parties
        if (!userId.equals(ticket.getCreatedBy())) {
            notificationService.createNotification(
                    ticket.getCreatedBy(),
                    "New comment on your ticket: " + ticket.getTitle(),
                    NotificationType.TICKET
            );
        }
        if (ticket.getAssignedTo() != null && !userId.equals(ticket.getAssignedTo())) {
            notificationService.createNotification(
                    ticket.getAssignedTo(),
                    "New comment on assigned ticket: " + ticket.getTitle(),
                    NotificationType.TICKET
            );
        }

        return CommentResponse.from(savedComment);
    }

    public void deleteComment(String ticketId, String commentId, String userId) {
        TicketComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("TicketComment", "id", commentId));

        if (!comment.getTicketId().equals(ticketId)) {
            throw new IllegalArgumentException("Comment does not belong to this ticket");
        }

        if (!comment.getAuthorId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }
    
    public List<CommentResponse> getComments(String ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(CommentResponse::from)
                .collect(Collectors.toList());
    }

    // --- ADMIN METHODS ---

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    public TicketResponse assignTechnician(String ticketId, String technicianId) {
        Ticket ticket = getTicketById(ticketId);
        
        // Verify technician exists and has role
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", technicianId));
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("User is not a TECHNICIAN");
        }

        ticket.setAssignedTo(technicianId);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // Notify Technician
        notificationService.createNotification(
                technicianId,
                "You have been assigned to a ticket: " + ticket.getTitle(),
                NotificationType.TICKET
        );
        // Notify User
        notificationService.createNotification(
                ticket.getCreatedBy(),
                "Your ticket is now assigned to a technician and is IN PROGRESS.",
                NotificationType.TICKET
        );

        return TicketResponse.from(saved);
    }

    public TicketResponse rejectTicket(String ticketId, String rejectionReason) {
        Ticket ticket = getTicketById(ticketId);
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(rejectionReason);
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // Notify User
        notificationService.createNotification(
                ticket.getCreatedBy(),
                "Your ticket has been REJECTED. Reason: " + rejectionReason,
                NotificationType.TICKET
        );

        return TicketResponse.from(saved);
    }

    // --- TECHNICIAN METHODS ---

    public List<TicketResponse> getAssignedTickets(String technicianId) {
        return ticketRepository.findByAssignedToOrderByCreatedAtDesc(technicianId)
                .stream()
                .map(TicketResponse::from)
                .collect(Collectors.toList());
    }

    public TicketResponse resolveTicket(String ticketId, String resolutionNotes, String technicianId) {
        Ticket ticket = getTicketById(ticketId);
        
        if (!technicianId.equals(ticket.getAssignedTo())) {
            throw new org.springframework.security.access.AccessDeniedException("You are not assigned to this ticket");
        }

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNotes(resolutionNotes);
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // Notify User
        notificationService.createNotification(
                ticket.getCreatedBy(),
                "Your ticket has been RESOLVED.",
                NotificationType.TICKET
        );

        return TicketResponse.from(saved);
    }

    // --- UTILS ---

    public Ticket getTicketById(String ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
    }
}
