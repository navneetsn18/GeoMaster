package com.geomaster.exception;

public class SessionAlreadyCompletedException extends IllegalStateException {
    public SessionAlreadyCompletedException(String sessionId) {
        super("Game session is already completed: " + sessionId);
    }
}
