package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * MongoDB document representing a registered user in the Smart Campus system.
 * Passwords are stored as BCrypt hashes — never in plain text.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    /** Full display name of the user */
    private String name;

    /** Email used as the unique login identifier */
    @Indexed(unique = true)
    private String email;

    /** BCrypt-hashed password — never store plain text */
    private String password;

    /** Role determines endpoint access (USER / ADMIN / TECHNICIAN) */
    private Role role;

    /** The authentication provider used (LOCAL or GOOGLE) */
    private Provider provider;

    /** Timestamp of account creation */
    private LocalDateTime createdAt;
}
