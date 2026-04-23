package com.smartcampus.backend.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.smartcampus.backend.model.Ticket;
import com.smartcampus.backend.model.TicketStatus;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {
    List<Ticket> findByCreatedByOrderByCreatedAtDesc(String createdBy);
    List<Ticket> findByAssignedToOrderByCreatedAtDesc(String assignedTo);
    List<Ticket> findByStatusAndAssignedToIsNullOrderByCreatedAtDesc(TicketStatus status);
}
