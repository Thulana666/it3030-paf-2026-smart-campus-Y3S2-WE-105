package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.ResourceAssignment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResourceAssignmentRepository extends MongoRepository<ResourceAssignment, String> {
    List<ResourceAssignment> findByTechnicianId(String technicianId);
    List<ResourceAssignment> findByTechnicianIdAndStatus(String technicianId, String status);
    List<ResourceAssignment> findByResourceId(String resourceId);
    List<ResourceAssignment> findByStatus(String status);
}
