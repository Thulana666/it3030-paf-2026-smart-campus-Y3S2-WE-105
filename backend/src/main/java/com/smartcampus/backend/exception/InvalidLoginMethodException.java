package com.smartcampus.backend.exception;

/**
 * Exception thrown when a user attempts to authenticate across 
 * unauthorized provider boundaries (e.g. attempting Native login on a Google account).
 */
public class InvalidLoginMethodException extends RuntimeException {
    public InvalidLoginMethodException(String message) {
        super(message);
    }
}
