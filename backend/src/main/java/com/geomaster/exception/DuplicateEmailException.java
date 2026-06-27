package com.geomaster.exception;

public class DuplicateEmailException extends IllegalArgumentException {
    public DuplicateEmailException(String email) {
        super("Email already in use: " + email);
    }
}
