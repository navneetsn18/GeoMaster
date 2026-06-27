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
}
