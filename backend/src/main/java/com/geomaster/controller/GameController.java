package com.geomaster.controller;

import com.geomaster.dto.request.GuessRequest;
import com.geomaster.dto.request.StartSessionRequest;
import com.geomaster.dto.response.GameCompleteDto;
import com.geomaster.dto.response.GameSessionDto;
import com.geomaster.dto.response.GuessResultDto;
import com.geomaster.service.GameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @PostMapping("/session/start")
    public ResponseEntity<GameSessionDto> startSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StartSessionRequest request) {
        GameSessionDto session = gameService.startSession(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @PostMapping("/session/{sessionId}/guess")
    public ResponseEntity<GuessResultDto> submitGuess(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID sessionId,
            @Valid @RequestBody GuessRequest request) {
        GuessResultDto result = gameService.submitGuess(userDetails.getUsername(), sessionId, request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/session/{sessionId}/complete")
    public ResponseEntity<GameCompleteDto> completeSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID sessionId) {
        GameCompleteDto result = gameService.completeSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.ok(result);
    }
}
