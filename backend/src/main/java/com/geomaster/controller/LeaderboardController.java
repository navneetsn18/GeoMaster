package com.geomaster.controller;

import com.geomaster.dto.response.LeaderboardEntryDto;
import com.geomaster.model.enums.MapType;
import com.geomaster.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<List<LeaderboardEntryDto>> getLeaderboard(
            @RequestParam(defaultValue = "WORLD") MapType mapType,
            @RequestParam(defaultValue = "ALL_TIME") String period,
            @RequestParam(defaultValue = "50") int limit) {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getLeaderboard(mapType, period, limit);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/following")
    public ResponseEntity<List<LeaderboardEntryDto>> getFollowingLeaderboard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "WORLD") MapType mapType,
            @RequestParam(defaultValue = "ALL_TIME") String period) {
        List<LeaderboardEntryDto> leaderboard = leaderboardService.getFollowingLeaderboard(
                userDetails.getUsername(), mapType, period);
        return ResponseEntity.ok(leaderboard);
    }
}
