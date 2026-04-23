package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ActivationRequest;
import com.smartcampus.backend.model.ActivationRequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivationRequestRepository extends MongoRepository<ActivationRequest, String> {
    List<ActivationRequest> findByStatus(ActivationRequestStatus status);
    List<ActivationRequest> findByResourceId(String resourceId);
    List<ActivationRequest> findByTechnicianId(String technicianId);
}

