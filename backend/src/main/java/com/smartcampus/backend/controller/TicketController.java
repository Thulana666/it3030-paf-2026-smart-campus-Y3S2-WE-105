package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.CommentRequest;
import com.smartcampus.backend.dto.CommentResponse;
import com.smartcampus.backend.dto.TicketCreateRequest;
import com.smartcampus.backend.dto.TicketResponse;
import com.smartcampus.backend.security.CustomUserDetails;
import com.smartcampus.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @ModelAttribute TicketCreateRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        TicketResponse response = ticketService.createTicket(request, images, userDetails.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my")
    public ResponseEntity<List<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        List<TicketResponse> responses = ticketService.getMyTickets(userDetails.getId());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable String id) {
        List<CommentResponse> responses = ticketService.getComments(id);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        CommentResponse response = ticketService.addComment(id, request, userDetails.getId());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        ticketService.deleteComment(id, commentId, userDetails.getId());
        return ResponseEntity.noContent().build();
    }
}
