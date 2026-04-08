package com.smartcampus.backend.model;

/**
 * Roles supported by the Smart Campus system.
 * Used for role-based access control (RBAC).
 */
public enum Role {
    USER,       // Standard student/staff user
    ADMIN,      // Campus administrator
    TECHNICIAN  // Maintenance / IT technician
}
