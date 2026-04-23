package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.TicketResponse;
import com.smartcampus.backend.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tickets")
@RequiredArgsConstructor
public class AdminTicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable String id,
            @RequestParam String technicianId) {
        
        TicketResponse response = ticketService.assignTechnician(id, technicianId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<TicketResponse> rejectTicket(
            @PathVariable String id,
            @RequestParam String rejectionReason) {
        
        TicketResponse response = ticketService.rejectTicket(id, rejectionReason);
        return ResponseEntity.ok(response);
    }
}
