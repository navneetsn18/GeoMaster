package com.geomaster.controller;

import com.geomaster.repository.GameSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final GameSessionRepository gameSessionRepository;

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
        boolean recentActivity = gameSessionRepository.existsByStartedAtAfter(since);
        return Map.of("alive", true, "shouldKeepAlive", recentActivity);
    }
}
