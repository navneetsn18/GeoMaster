package com.geomaster.exception;

public class InvalidMapTypeException extends RuntimeException {
    public InvalidMapTypeException(String mapType) {
        super("Invalid map type: " + mapType);
    }
}
