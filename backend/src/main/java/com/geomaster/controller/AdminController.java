package com.geomaster.controller;

import com.geomaster.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminService.AdminStats> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.requireAdmin(userDetails.getUsername());
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        adminService.requireAdmin(userDetails.getUsername());
        return ResponseEntity.ok(adminService.getUsers());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {
        adminService.requireAdmin(userDetails.getUsername());
        adminService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Map<String, String>> deleteSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {
        adminService.requireAdmin(userDetails.getUsername());
        adminService.deleteSession(id);
        return ResponseEntity.ok(Map.of("message", "Session deleted"));
    }

    @DeleteMapping("/users/{id}/sessions")
    public ResponseEntity<Map<String, String>> deleteUserSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {
        adminService.requireAdmin(userDetails.getUsername());
        adminService.deleteUserSessions(id);
        return ResponseEntity.ok(Map.of("message", "Sessions deleted"));
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<AdminService.UserRow> banUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        adminService.requireAdmin(userDetails.getUsername());
        String reason = body.getOrDefault("reason", "Banned by admin");
        return ResponseEntity.ok(adminService.banUser(id, reason));
    }

    @PostMapping("/users/{id}/unban")
    public ResponseEntity<Map<String, String>> unbanUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id) {
        adminService.requireAdmin(userDetails.getUsername());
        adminService.unbanUser(id);
        return ResponseEntity.ok(Map.of("message", "User unbanned"));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<Map<String, String>> setRole(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        adminService.requireAdmin(userDetails.getUsername());
        adminService.setRole(id, body.get("role"));
        return ResponseEntity.ok(Map.of("message", "Role updated"));
    }
}
