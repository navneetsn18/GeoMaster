package com.geomaster.exception;

public class SessionNotFoundException extends RuntimeException {
    public SessionNotFoundException(String sessionId) {
        super("Game session not found: " + sessionId);
    }
}
