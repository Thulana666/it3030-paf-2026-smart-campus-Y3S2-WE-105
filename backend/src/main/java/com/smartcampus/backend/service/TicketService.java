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

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** Build a TicketResponse enriched with display names. */
    private TicketResponse enrichTicket(Ticket ticket) {
        TicketResponse response = TicketResponse.from(ticket);

        if (ticket.getCreatedBy() != null) {
            userRepository.findById(ticket.getCreatedBy()).ifPresent(u ->
                    response.setCreatedByName(u.getName() != null ? u.getName() : u.getEmail()));
        }
        if (ticket.getAssignedTo() != null) {
            userRepository.findById(ticket.getAssignedTo()).ifPresent(u ->
                    response.setAssignedToName(u.getName() != null ? u.getName() : u.getEmail()));
        }
        return response;
    }

    private boolean isUnassigned(Ticket ticket) {
        return ticket.getAssignedTo() == null || ticket.getAssignedTo().isBlank();
    }

    private boolean matchesTechnician(Ticket ticket, String technicianId, String technicianEmail) {
        if (isUnassigned(ticket)) {
            return false;
        }

        String assignedTo = ticket.getAssignedTo();
        boolean idMatch = technicianId != null && !technicianId.isBlank() && technicianId.equals(assignedTo);
        boolean emailMatch = technicianEmail != null && !technicianEmail.isBlank()
                && technicianEmail.equalsIgnoreCase(assignedTo);

        return idMatch || emailMatch;
    }

    /** Build a CommentResponse enriched with author name and role. */
    private CommentResponse enrichComment(TicketComment comment) {
        CommentResponse response = CommentResponse.from(comment);
        userRepository.findById(comment.getAuthorId()).ifPresent(u -> {
            response.setAuthorName(u.getName() != null ? u.getName() : u.getEmail());
            response.setAuthorRole(u.getRole() != null ? u.getRole().name() : "USER");
        });
        return response;
    }

    // ─── USER METHODS ─────────────────────────────────────────────────────────

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

        // Notify Admins & Technicians
        for (Role r : List.of(Role.ADMIN, Role.TECHNICIAN)) {
            List<User> list = userRepository.findByRole(r);
            for (User u : list) {
                notificationService.createNotification(
                        u.getId(),
                        (r == Role.TECHNICIAN ? "New maintenance ticket: " : "New ticket created: ") + ticket.getTitle(),
                        NotificationType.TICKET
                );
            }
        }

        return enrichTicket(savedTicket);
    }

    public List<TicketResponse> getMyTickets(String userId) {
        return ticketRepository.findByCreatedByOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::enrichTicket)
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

        return enrichTicket(ticketRepository.save(ticket));
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

        // Determine if the comment author is a technician
        boolean isAuthorTech = userRepository.findById(userId)
                .map(u -> u.getRole() == Role.TECHNICIAN).orElse(false);
                
        boolean isCreator = userId.equals(ticket.getCreatedBy());

        // Notify creator if someone else (like a Technician) comments
        if (!isCreator) {
            String prefix = isAuthorTech ? "Technician replied to your ticket: " : "New comment on your ticket: ";
            notificationService.createNotification(
                    ticket.getCreatedBy(),
                    prefix + ticket.getTitle(),
                    NotificationType.TICKET
            );
        }

        // Notify technician if assigned
        if (ticket.getAssignedTo() != null) {
            if (!userId.equals(ticket.getAssignedTo())) {
                notificationService.createNotification(
                        ticket.getAssignedTo(),
                        "New comment on assigned ticket: " + ticket.getTitle(),
                        NotificationType.TICKET
                );
            }
        } else if (isCreator) {
            // Ticket is unassigned and user just commented -> notify all Technicians
            List<User> techs = userRepository.findByRole(Role.TECHNICIAN);
            for (User tech : techs) {
                notificationService.createNotification(
                        tech.getId(),
                        "User replied to unassigned ticket: " + ticket.getTitle(),
                        NotificationType.TICKET
                );
            }
        }

        return enrichComment(savedComment);
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
                .map(this::enrichComment)
                .collect(Collectors.toList());
    }

    // ─── ADMIN METHODS ────────────────────────────────────────────────────────

    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAll()
                .stream()
                .map(this::enrichTicket)
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

        return enrichTicket(saved);
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

        return enrichTicket(saved);
    }

    // ─── TECHNICIAN METHODS ───────────────────────────────────────────────────

    private void ensureTechnicianCanManageTicket(Ticket ticket, String technicianId, String technicianEmail) {
        if (isUnassigned(ticket)) {
            if (technicianId != null && !technicianId.isBlank()) {
                ticket.setAssignedTo(technicianId);
            } else if (technicianEmail != null && !technicianEmail.isBlank()) {
                ticket.setAssignedTo(technicianEmail);
            } else {
                throw new org.springframework.security.access.AccessDeniedException("Unable to resolve technician identity");
            }
            return;
        }

        if (!matchesTechnician(ticket, technicianId, technicianEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("You are not assigned to this ticket");
        }
    }

    public List<TicketResponse> getAssignedTickets(String technicianId, String technicianEmail) {
        List<Ticket> assigned = new ArrayList<>();

        if (technicianId != null && !technicianId.isBlank()) {
            assigned.addAll(ticketRepository.findByAssignedToOrderByCreatedAtDesc(technicianId));
        }

        if (technicianEmail != null && !technicianEmail.isBlank()) {
            ticketRepository.findByAssignedToOrderByCreatedAtDesc(technicianEmail).forEach(ticket -> {
                if (assigned.stream().noneMatch(existing -> existing.getId().equals(ticket.getId()))) {
                    assigned.add(ticket);
                }
            });
        }

        List<Ticket> unassigned = ticketRepository.findAll().stream()
                .filter(ticket -> ticket.getStatus() == TicketStatus.OPEN && isUnassigned(ticket))
                .collect(Collectors.toCollection(ArrayList::new));

        List<Ticket> allTickets = new ArrayList<>(assigned);
        unassigned.forEach(ticket -> {
            if (allTickets.stream().noneMatch(existing -> existing.getId().equals(ticket.getId()))) {
                allTickets.add(ticket);
            }
        });

        return allTickets.stream()
                .map(this::enrichTicket)
                .collect(Collectors.toList());
    }

    public TicketResponse resolveTicket(String ticketId, String resolutionNotes, String technicianId, String technicianEmail) {
        Ticket ticket = getTicketById(ticketId);

        ensureTechnicianCanManageTicket(ticket, technicianId, technicianEmail);

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolutionNotes(resolutionNotes);
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // Notify User
        notificationService.createNotification(
                ticket.getCreatedBy(),
                "Your ticket has been RESOLVED: " + ticket.getTitle(),
                NotificationType.TICKET
        );

        return enrichTicket(saved);
    }

    public TicketResponse updateTicketStatus(String ticketId, String newStatus, String resolutionNotes, String technicianId, String technicianEmail) {
        Ticket ticket = getTicketById(ticketId);

        ensureTechnicianCanManageTicket(ticket, technicianId, technicianEmail);

        TicketStatus status = TicketStatus.valueOf(newStatus);
        ticket.setStatus(status);
        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes);
        }
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // Notify student when status changes meaningfully
        String statusMsg = switch (status) {
            case IN_PROGRESS -> "Your ticket is now IN PROGRESS: " + ticket.getTitle();
            case RESOLVED    -> "Your ticket has been RESOLVED: " + ticket.getTitle();
            case CLOSED      -> "Your ticket has been CLOSED as solved: " + ticket.getTitle();
            default          -> null;
        };
        if (statusMsg != null) {
            notificationService.createNotification(ticket.getCreatedBy(), statusMsg, NotificationType.TICKET);
        }

        return enrichTicket(saved);
    }

    public TicketResponse closeTicket(String ticketId, String resolutionNotes, String technicianId, String technicianEmail) {
        Ticket ticket = getTicketById(ticketId);

        ensureTechnicianCanManageTicket(ticket, technicianId, technicianEmail);

        ticket.setStatus(TicketStatus.CLOSED);
        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes);
        }
        ticket.setUpdatedAt(LocalDateTime.now());

        Ticket saved = ticketRepository.save(ticket);

        // Notify student
        notificationService.createNotification(
                ticket.getCreatedBy(),
                "✅ Your ticket has been CLOSED as solved: " + ticket.getTitle(),
                NotificationType.TICKET
        );

        return enrichTicket(saved);
    }

    // ─── UTILS ───────────────────────────────────────────────────────────────

    public Ticket getTicketById(String ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket", "id", ticketId));
    }

    public TicketResponse enrichedTicketById(String ticketId) {
        return enrichTicket(getTicketById(ticketId));
    }
}

