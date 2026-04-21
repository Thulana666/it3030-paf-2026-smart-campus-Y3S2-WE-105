package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.TicketResponse;
import com.smartcampus.backend.security.CustomUserDetails;
import com.smartcampus.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technician/tickets")
@RequiredArgsConstructor
public class TechnicianTicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAssignedTickets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<TicketResponse> responses = ticketService.getAssignedTickets(userDetails.getId());
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<TicketResponse> resolveTicket(
            @PathVariable String id,
            @RequestParam String resolutionNotes,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        TicketResponse response = ticketService.resolveTicket(id, resolutionNotes, userDetails.getId());
        return ResponseEntity.ok(response);
    }
}
