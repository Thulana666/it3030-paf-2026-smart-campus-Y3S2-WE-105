package com.smartcampus.backend.dto;

import com.smartcampus.backend.model.TicketComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private String id;
    private String ticketId;
    private String authorId;
    private String authorName;   // Populated by TicketService from UserRepository
    private String authorRole;   // "TECHNICIAN" | "USER" | "ADMIN"
    private String content;
    private LocalDateTime createdAt;

    public static CommentResponse from(TicketComment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicketId())
                .authorId(comment.getAuthorId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
