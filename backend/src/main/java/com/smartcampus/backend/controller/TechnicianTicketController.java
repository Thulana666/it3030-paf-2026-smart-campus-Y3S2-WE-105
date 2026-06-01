package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.CommentRequest;
import com.smartcampus.backend.dto.CommentResponse;
import com.smartcampus.backend.dto.TicketResponse;
import com.smartcampus.backend.security.CustomUserDetails;
import com.smartcampus.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/technician/tickets")
@RequiredArgsConstructor
public class TechnicianTicketController {

    private final TicketService ticketService;

    /** GET all tickets assigned to this technician */
    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<TicketResponse> responses = ticketService.getAssignedTickets(userDetails.getId(), userDetails.getUsername());
        return ResponseEntity.ok(responses);
    }

    /** GET a single ticket assigned to this technician */
    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        TicketResponse response = ticketService.enrichedTicketById(id);
        return ResponseEntity.ok(response);
    }

    /** PUT update ticket status (IN_PROGRESS, RESOLVED, etc.) */
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String status = body.get("status");
        String notes  = body.getOrDefault("resolutionNotes", null);
        TicketResponse response = ticketService.updateTicketStatus(id, status, notes, userDetails.getId(), userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /** PUT resolve ticket (legacy endpoint — kept for compatibility) */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<TicketResponse> resolveTicket(
            @PathVariable String id,
            @RequestParam String resolutionNotes,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        TicketResponse response = ticketService.resolveTicket(id, resolutionNotes, userDetails.getId(), userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /** PUT close a ticket as solved */
    @PutMapping("/{id}/close")
    public ResponseEntity<TicketResponse> closeTicket(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        String notes = body != null ? body.getOrDefault("resolutionNotes", null) : null;
        TicketResponse response = ticketService.closeTicket(id, notes, userDetails.getId(), userDetails.getUsername());
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
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        CommentResponse response = ticketService.addComment(id, request, userDetails.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
