package com.geomaster.controller;

import com.geomaster.dto.response.UserDto;
import com.geomaster.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserService.UserProfile> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserService.UserProfile profile = userService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/history")
    public ResponseEntity<UserService.HistoryPage> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        UserService.HistoryPage history = userService.getHistory(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(history);
    }

    @PostMapping("/following")
    public ResponseEntity<Map<String, String>> follow(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        String username = body.get("username");
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "username is required"));
        }
        userService.follow(userDetails.getUsername(), username);
        return ResponseEntity.ok(Map.of("message", "Now following"));
    }

    @DeleteMapping("/following/{username}")
    public ResponseEntity<Map<String, String>> unfollow(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String username) {
        userService.unfollow(userDetails.getUsername(), username);
        return ResponseEntity.ok(Map.of("message", "Unfollowed"));
    }

    @GetMapping("/following")
    public ResponseEntity<List<UserDto>> getFollowing(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<UserDto> following = userService.getFollowing(userDetails.getUsername());
        return ResponseEntity.ok(following);
    }

    @PatchMapping("/profile")
    public ResponseEntity<UserService.UserProfile> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        UserService.UserProfile updated = userService.updateProfile(
                userDetails.getUsername(),
                body.get("username"),
                body.get("email"));
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/admin-contacts")
    public ResponseEntity<List<UserService.AdminContact>> getAdminContacts() {
        return ResponseEntity.ok(userService.getAdminContacts());
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String avatarUrl = userService.uploadAvatar(userDetails.getUsername(), file);
        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
    }

    // ── Public history for a followed user ──────────────────────────────────

    @GetMapping("/users/{userId}/history")
    public ResponseEntity<UserService.HistoryPage> getPublicHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                userService.getPublicHistory(userDetails.getUsername(), userId, page, size));
    }

    // ── Session guesses (own or followed user's session) ────────────────────

    @GetMapping("/sessions/{sessionId}/guesses")
    public ResponseEntity<List<UserService.GuessRow>> getSessionGuesses(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String sessionId) {
        return ResponseEntity.ok(
                userService.getSessionGuesses(userDetails.getUsername(), sessionId));
    }

    // ── User-level session flags ─────────────────────────────────────────────

    @PostMapping("/sessions/{sessionId}/user-flag")
    public ResponseEntity<Map<String, Object>> flagSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String sessionId) {
        return ResponseEntity.ok(
                userService.flagSession(userDetails.getUsername(), sessionId));
    }

    @DeleteMapping("/sessions/{sessionId}/user-flag")
    public ResponseEntity<Map<String, Object>> unflagSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String sessionId) {
        return ResponseEntity.ok(
                userService.unflagSession(userDetails.getUsername(), sessionId));
    }

    @GetMapping("/sessions/{sessionId}/user-flag")
    public ResponseEntity<Map<String, Object>> getFlagStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String sessionId) {
        return ResponseEntity.ok(
                userService.getFlagStatus(userDetails.getUsername(), sessionId));
    }
}
