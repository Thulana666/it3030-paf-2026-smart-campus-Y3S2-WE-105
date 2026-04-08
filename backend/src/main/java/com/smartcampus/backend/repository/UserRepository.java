package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * MongoDB repository for User documents.
 * Spring Data auto-generates all basic CRUD + the custom query below.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /** Used during login to load user details by email. */
    Optional<User> findByEmail(String email);

    /** Used during registration to prevent duplicate accounts. */
    boolean existsByEmail(String email);
}
