package com.smartcampus.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.backend.dto.CommentRequest;
import com.smartcampus.backend.dto.CommentResponse;
import com.smartcampus.backend.dto.TicketResponse;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.CustomUserDetails;
import com.smartcampus.backend.service.TicketService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/technician/tickets")
@RequiredArgsConstructor
public class TechnicianTicketController {

    private final TicketService ticketService;
    private final UserRepository userRepository;

    private record TechnicianIdentity(String id, String email) {}

    private TechnicianIdentity resolveTechnicianIdentity(UserDetails principal) {
        if (principal == null) {
            throw new AccessDeniedException("Unauthorized request");
        }

        String email = principal.getUsername();
        String id = null;

        if (principal instanceof CustomUserDetails custom) {
            id = custom.getId();
        }

        if ((id == null || id.isBlank()) && email != null && !email.isBlank()) {
            id = userRepository.findByEmail(email)
                    .map(User::getId)
                    .orElse(null);
        }

        if (id == null || id.isBlank()) {
            throw new AccessDeniedException("Unable to resolve technician identity");
        }

        return new TechnicianIdentity(id, email);
    }

    /** GET all tickets assigned to this technician */
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal UserDetails userDetails) {

        TechnicianIdentity identity = resolveTechnicianIdentity(userDetails);
        List<TicketResponse> responses = ticketService.getAssignedTickets(identity.id(), identity.email());
        return ResponseEntity.ok(responses);
    }

    /** GET a single ticket assigned to this technician */
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {

        resolveTechnicianIdentity(userDetails);

        TicketResponse response = ticketService.enrichedTicketById(id);
        return ResponseEntity.ok(response);
    }

    /** PUT update ticket status (IN_PROGRESS, RESOLVED, etc.) */
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        TechnicianIdentity identity = resolveTechnicianIdentity(userDetails);

        String status = body.get("status");
        String notes  = body.getOrDefault("resolutionNotes", null);
        TicketResponse response = ticketService.updateTicketStatus(id, status, notes, identity.id(), identity.email());
        return ResponseEntity.ok(response);
    }

    /** PUT resolve ticket (legacy endpoint — kept for compatibility) */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<TicketResponse> resolveTicket(
            @PathVariable String id,
            @RequestParam String resolutionNotes,
            @AuthenticationPrincipal UserDetails userDetails) {

        TechnicianIdentity identity = resolveTechnicianIdentity(userDetails);

        TicketResponse response = ticketService.resolveTicket(id, resolutionNotes, identity.id(), identity.email());
        return ResponseEntity.ok(response);
    }

    /** PUT close a ticket as solved */
    @PutMapping("/{id}/close")
    public ResponseEntity<TicketResponse> closeTicket(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {

        TechnicianIdentity identity = resolveTechnicianIdentity(userDetails);

        String notes = body != null ? body.getOrDefault("resolutionNotes", null) : null;
        TicketResponse response = ticketService.closeTicket(id, notes, identity.id(), identity.email());
        return ResponseEntity.ok(response);
    }

    /** GET comments for a ticket */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable String id) {
        return ResponseEntity.ok(ticketService.getComments(id));
    }

    /** POST add a comment (technician replying to student) */
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String id,
            @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        TechnicianIdentity identity = resolveTechnicianIdentity(userDetails);

        CommentResponse response = ticketService.addComment(id, request, identity.id());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
