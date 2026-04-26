package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.RepairProgressRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairProgressRepository extends MongoRepository<RepairProgressRecord, String> {
    List<RepairProgressRecord> findByResourceIdOrderByCreatedAtDesc(String resourceId);
}