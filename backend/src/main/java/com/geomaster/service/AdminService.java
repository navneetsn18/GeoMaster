package com.geomaster.service;

import com.geomaster.model.GameSession;
import com.geomaster.model.User;
import com.geomaster.repository.FriendshipRepository;
import com.geomaster.repository.GameSessionRepository;
import com.geomaster.repository.GuessRecordRepository;
import com.geomaster.repository.UserRepository;
import com.geomaster.exception.SessionNotFoundException;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    private final UserRepository userRepository;
    private final GameSessionRepository gameSessionRepository;
    private final GuessRecordRepository guessRecordRepository;
    private final FriendshipRepository friendshipRepository;

    public void requireAdmin(String callerEmail) {
        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new SecurityException("Access denied"));
        if (!"ADMIN".equals(caller.getRole())) {
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
    public static class GuessRow {
        private String id;
        private String countryCode;
        private boolean correct;
        private int timeTakenMs;
        private int pointsEarned;
        private String guessedAt;
    }

    @Data
    @Builder
    public static class SessionRow {
        private String id;
        private String mapType;
        private int finalScore;
        private int correctCount;
        private int totalCount;
        private int bestStreak;
        private String status;
        private String startedAt;
        private String completedAt;
        private int flagCount;
        private List<GuessRow> guesses;
    }

    @Data
    @Builder
    public static class UserRow {
        private String id;
        private String username;
        private String email;
        private String role;
        private long gamesPlayed;
        private String avatarUrl;
        private boolean banned;
        private String banReason;
        private String bannedAt;
        private Integer bestScore;
        private Double avgAccuracy;
        private Integer bestStreak;
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
                        .role(u.getRole())
                        .gamesPlayed(gameCounts.getOrDefault(u.getId(), 0L))
                        .avatarUrl(u.getAvatarUrl())
                        .banned(u.isBanned())
                        .banReason(u.getBanReason())
                        .bannedAt(u.getBannedAt() != null ? u.getBannedAt().toString() : null)
                        .bestScore(gameSessionRepository.findBestScoreByUserId(u.getId()).orElse(0))
                        .avgAccuracy(gameSessionRepository.findAvgAccuracyByUserId(u.getId()).orElse(0.0) * 100.0)
                        .bestStreak(gameSessionRepository.findBestStreakByUserId(u.getId()).orElse(0))
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SessionRow> getUserSessions(String userId) {
        var sessions = gameSessionRepository
                .findByUserIdOrderByStartedAtDesc(userId, PageRequest.of(0, 200))
                .getContent();
        return sessions.stream().map(s -> {
            var guesses = guessRecordRepository.findBySessionIdOrderByGuessedAtAsc(s.getId())
                    .stream().map(g -> GuessRow.builder()
                            .id(g.getId())
                            .countryCode(g.getCountryCode())
                            .correct(g.isCorrect())
                            .timeTakenMs(g.getTimeTakenMs())
                            .pointsEarned(g.getPointsEarned())
                            .guessedAt(g.getGuessedAt() != null ? g.getGuessedAt().toString() : null)
                            .build())
                    .toList();
            return SessionRow.builder()
                    .id(s.getId())
                    .mapType(s.getMapType())
                    .finalScore(s.getFinalScore())
                    .correctCount(s.getCorrectCount())
                    .totalCount(s.getTotalCount())
                    .bestStreak(s.getBestStreak())
                    .status(s.getStatus())
                    .startedAt(s.getStartedAt() != null ? s.getStartedAt().toString() : null)
                    .completedAt(s.getCompletedAt() != null ? s.getCompletedAt().toString() : null)
                    .flagCount(s.getFlagCount())
                    .guesses(guesses)
                    .build();
        }).toList();
    }

    @Transactional
    public void flagSession(String sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));

        // Already flagged — prevent same session being counted multiple times
        if (session.getFlagCount() >= 1) return;

        session.setFlagCount(1);
        gameSessionRepository.save(session);

        // Count distinct flagged sessions across this user (not flags on one session)
        long flaggedCount = gameSessionRepository.countFlaggedSessionsByUserId(session.getUserId());

        if (flaggedCount >= 3) {
            userRepository.findById(session.getUserId()).ifPresent(user -> {
                if (!user.isBanned()) {
                    user.setBanned(true);
                    user.setBannedAt(Instant.now());
                    user.setBanReason("Auto-banned: 3 flagged sessions detected");
                    userRepository.save(user);
                    // Hide from leaderboard — do NOT delete, history stays for user
                    gameSessionRepository.hideAllByUserId(user.getId());
                }
            });
        }
    }

    @Transactional
    public void unflagSession(String sessionId) {
        GameSession session = gameSessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId));
        session.setFlagCount(Math.max(0, session.getFlagCount() - 1));
        gameSessionRepository.save(session);
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
        userRepository.save(user);
        // hide from leaderboard; history stays visible to user
        gameSessionRepository.hideAllByUserId(userId);
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

    @Transactional
    public void setRole(String userId, String role) {
        if (!"USER".equals(role) && !"ADMIN".equals(role))
            throw new IllegalArgumentException("Role must be USER or ADMIN");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setRole(role);
        userRepository.save(user);
    }
}
