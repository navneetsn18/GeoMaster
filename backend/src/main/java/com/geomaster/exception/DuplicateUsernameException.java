package com.geomaster.exception;

public class DuplicateUsernameException extends IllegalArgumentException {
    public DuplicateUsernameException(String username) {
        super("Username already taken: " + username);
    }
}
