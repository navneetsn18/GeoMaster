package com.geomaster.service;

import com.geomaster.model.User;
import com.geomaster.repository.FriendshipRepository;
import com.geomaster.repository.GameSessionRepository;
import com.geomaster.repository.UserRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final String ADMIN_EMAIL = "navneetsn18@gmail.com";

    private final UserRepository userRepository;
    private final GameSessionRepository gameSessionRepository;
    private final FriendshipRepository friendshipRepository;

    public void requireAdmin(String callerEmail) {
        if (!ADMIN_EMAIL.equals(callerEmail)) {
            throw new SecurityException("Access denied");
        }
    }

    @Data
    @Builder
    public static class AdminStats {
        private long totalUsers;
        private long totalGames;
        private long completedGames;
        private long activeSessions;
        private double totalHoursPlayed;
        private long bannedUsers;
    }

    @Data
    @Builder
    public static class UserRow {
        private String id;
        private String username;
        private String email;
        private long gamesPlayed;
        private String avatarUrl;
        private boolean banned;
        private String banReason;
        private String bannedAt;
    }

    @Transactional(readOnly = true)
    public AdminStats getStats() {
        long totalUsers = userRepository.count();
        long totalGames = gameSessionRepository.count();
        long completedGames = gameSessionRepository.countByStatus("COMPLETED");
        long activeSessions = gameSessionRepository.countByStatus("IN_PROGRESS");
        long bannedUsers = userRepository.countByBanned(true);
        double totalSec = gameSessionRepository.sumTimeTakenSeconds();
        double totalHours = Math.round(totalSec / 3600.0 * 10) / 10.0;

        return AdminStats.builder()
                .totalUsers(totalUsers)
                .totalGames(totalGames)
                .completedGames(completedGames)
                .activeSessions(activeSessions)
                .totalHoursPlayed(totalHours)
                .bannedUsers(bannedUsers)
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserRow> getUsers() {
        List<User> users = userRepository.findAll();
        Map<String, Long> gameCounts = gameSessionRepository.findAll().stream()
                .collect(Collectors.groupingBy(gs -> gs.getUserId(), Collectors.counting()));

        return users.stream()
                .map(u -> UserRow.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .gamesPlayed(gameCounts.getOrDefault(u.getId(), 0L))
                        .avatarUrl(u.getAvatarUrl())
                        .banned(u.isBanned())
                        .banReason(u.getBanReason())
                        .bannedAt(u.getBannedAt() != null ? u.getBannedAt().toString() : null)
                        .build())
                .toList();
    }

    @Transactional
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void deleteSession(String id) {
        gameSessionRepository.deleteById(id);
    }

    @Transactional
    public void deleteUserSessions(String userId) {
        gameSessionRepository.deleteByUserId(userId);
    }

    @Transactional
    public UserRow banUser(String userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setBanned(true);
        user.setBannedAt(Instant.now());
        user.setBanReason(reason);
        // wipe all scores
        gameSessionRepository.deleteByUserId(userId);
        userRepository.save(user);
        return UserRow.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .gamesPlayed(0L)
                .banned(true)
                .banReason(reason)
                .bannedAt(user.getBannedAt().toString())
                .build();
    }

    @Transactional
    public void unbanUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setBanned(false);
        user.setBannedAt(null);
        user.setBanReason(null);
        userRepository.save(user);
    }
}
