package com.smartcampus.backend.service;

import com.smartcampus.backend.model.RepairProgressRecord;
import com.smartcampus.backend.repository.RepairProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RepairProgressService {

    @Autowired
    private RepairProgressRepository repairProgressRepository;

    public RepairProgressRecord createRepairProgress(
            String resourceId,
            String resourceName,
            String resourceCode,
            String progressStatus,
            String repairNotes,
            String technicianId,
            String technicianName,
            String technicianEmail
    ) {
        RepairProgressRecord record = new RepairProgressRecord();
        record.setResourceId(resourceId);
        record.setResourceName(resourceName);
        record.setResourceCode(resourceCode);
        record.setProgressStatus(progressStatus);
        record.setRepairNotes(repairNotes);
        record.setTechnicianId(technicianId);
        record.setTechnicianName(technicianName);
        record.setTechnicianEmail(technicianEmail);
        record.setCreatedAt(LocalDateTime.now());
        record.setUpdatedAt(LocalDateTime.now());
        return repairProgressRepository.save(record);
    }

    public List<RepairProgressRecord> getAllRepairProgress() {
        return repairProgressRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public List<RepairProgressRecord> getRepairProgressByResource(String resourceId) {
        return repairProgressRepository.findByResourceIdOrderByCreatedAtDesc(resourceId);
    }
}