package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MongoDB repository for Notification documents.
 */
@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    /** Fetch all notifications for a user, newest first. */
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    /** Fetch notifications by user and read status (e.g. unread only). */
    List<Notification> findByUserIdAndRead(String userId, boolean read);
}
