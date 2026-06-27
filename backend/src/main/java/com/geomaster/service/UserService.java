package com.geomaster.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.geomaster.dto.response.UserDto;
import com.geomaster.model.Friendship;
import com.geomaster.model.GameSession;
import com.geomaster.model.User;
import com.geomaster.repository.FriendshipRepository;
import com.geomaster.repository.GameSessionRepository;
import com.geomaster.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final GameSessionRepository gameSessionRepository;
    private final FriendshipRepository friendshipRepository;

    @Value("${app.upload-path:/app/uploads}")
    private String uploadPath;

    @Autowired(required = false)
    private Cloudinary cloudinary;

    public UserService(UserRepository userRepository,
                       GameSessionRepository gameSessionRepository,
                       FriendshipRepository friendshipRepository) {
        this.userRepository = userRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.friendshipRepository = friendshipRepository;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStats {
        private long totalGames;
        private double avgAccuracy;
        private int bestScore;
        private int bestStreak;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfile {
        private String id;
        private String username;
        private String email;
        private String avatarUrl;
        private UserStats stats;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryPage {
        private List<SessionSummary> content;
        private long totalElements;
        private int totalPages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionSummary {
        private String sessionId;   // matches frontend RecentGame.sessionId
        private String mapType;
        private int score;          // matches frontend RecentGame.score
        private int correctCount;
        private int totalCount;
        private double accuracy;
        private int bestStreak;
        private String playedAt;    // matches frontend RecentGame.playedAt
    }

    @Transactional(readOnly = true)
    public UserProfile getProfile(String email) {
        User user = findUser(email);

        long totalGames = gameSessionRepository.countCompletedByUserId(user.getId());
        double avgAccuracy = gameSessionRepository.findAvgAccuracyByUserId(user.getId()).orElse(0.0) * 100.0;
        int bestScore = gameSessionRepository.findBestScoreByUserId(user.getId()).orElse(0);
        int bestStreak = gameSessionRepository.findBestStreakByUserId(user.getId()).orElse(0);

        UserStats stats = UserStats.builder()
                .totalGames(totalGames)
                .avgAccuracy(avgAccuracy)
                .bestScore(bestScore)
                .bestStreak(bestStreak)
                .build();

        return UserProfile.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .stats(stats)
                .build();
    }

    @Transactional(readOnly = true)
    public HistoryPage getHistory(String email, int page, int size) {
        User user = findUser(email);
        Pageable pageable = PageRequest.of(page, size);
        Page<GameSession> sessionPage =
                gameSessionRepository.findByUserIdOrderByStartedAtDesc(user.getId(), pageable);

        List<SessionSummary> summaries = sessionPage.getContent().stream()
                .map(s -> {
                    double accuracy = s.getTotalCount() > 0
                            ? (double) s.getCorrectCount() / s.getTotalCount() * 100.0
                            : 0.0;
                    String playedAt = s.getCompletedAt() != null
                            ? s.getCompletedAt().toString()
                            : s.getStartedAt() != null ? s.getStartedAt().toString() : null;
                    return SessionSummary.builder()
                            .sessionId(s.getId())
                            .mapType(s.getMapType())
                            .score(s.getFinalScore())
                            .correctCount(s.getCorrectCount())
                            .totalCount(s.getTotalCount())
                            .accuracy(accuracy)
                            .bestStreak(s.getBestStreak())
                            .playedAt(playedAt)
                            .build();
                })
                .toList();

        return HistoryPage.builder()
                .content(summaries)
                .totalElements(sessionPage.getTotalElements())
                .totalPages(sessionPage.getTotalPages())
                .build();
    }

    @Transactional
    public void follow(String userEmail, String targetUsername) {
        User user = findUser(userEmail);
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUsername));

        if (user.getId().equals(target.getId())) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        if (friendshipRepository.existsByUserIdAndFriendId(user.getId(), target.getId())) {
            throw new IllegalArgumentException("Already following");
        }

        Friendship follow = Friendship.builder()
                .userId(user.getId())
                .friendId(target.getId())
                .build();
        friendshipRepository.save(follow);
    }

    @Transactional
    public void unfollow(String userEmail, String targetUsername) {
        User user = findUser(userEmail);
        User target = userRepository.findByUsername(targetUsername)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUsername));
        friendshipRepository.deleteByUserIdAndFriendId(user.getId(), target.getId());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getFollowing(String userEmail) {
        User user = findUser(userEmail);
        List<String> followingIds = friendshipRepository.findFriendIdsByUserId(user.getId());
        List<User> following = userRepository.findAllById(followingIds);
        return following.stream()
                .map(f -> UserDto.builder()
                        .id(f.getId())
                        .username(f.getUsername())
                        .avatarUrl(f.getAvatarUrl())
                        .totalGames(gameSessionRepository.countCompletedByUserId(f.getId()))
                        .bestScore(gameSessionRepository.findBestScoreByUserId(f.getId()).orElse(0))
                        .avgAccuracy(gameSessionRepository.findAvgAccuracyByUserId(f.getId()).orElse(0.0) * 100.0)
                        .bestStreak(gameSessionRepository.findBestStreakByUserId(f.getId()).orElse(0))
                        .build())
                .toList();
    }

    @Transactional
    public String uploadAvatar(String email, MultipartFile file) {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        String ct = file.getContentType();
        if (ct == null || !ct.startsWith("image/")) throw new IllegalArgumentException("Only image files allowed");

        User user = findUser(email);

        String avatarUrl;
        if (cloudinary != null) {
            // Use Cloudinary when configured
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = cloudinary.uploader().upload(
                        file.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "geomaster/avatars",
                                "public_id", user.getId(),
                                "overwrite", true,
                                "resource_type", "image"
                        ));
                avatarUrl = (String) result.get("secure_url");
            } catch (IOException e) {
                throw new UncheckedIOException("Cloudinary upload failed", e);
            }
        } else {
            // Fallback: local filesystem
            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "jpg";
            if (!List.of("jpg", "jpeg", "png", "gif", "webp").contains(ext)) ext = "jpg";
            Path dir = Paths.get(uploadPath, "avatars");
            try {
                Files.createDirectories(dir);
                String filename = user.getId() + "." + ext;
                for (String e : List.of("jpg", "jpeg", "png", "gif", "webp"))
                    Files.deleteIfExists(dir.resolve(user.getId() + "." + e));
                Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
                avatarUrl = "/uploads/avatars/" + filename;
            } catch (IOException e) {
                throw new UncheckedIOException("Failed to save avatar", e);
            }
        }

        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);
        return avatarUrl;
    }

    @Transactional
    public UserProfile updateProfile(String email, String newUsername, String newEmail) {
        User user = findUser(email);
        if (newUsername != null && !newUsername.isBlank()) {
            String trimmed = newUsername.trim();
            if (!trimmed.equals(user.getUsername())) {
                if (userRepository.existsByUsername(trimmed))
                    throw new IllegalArgumentException("Username already taken");
                user.setUsername(trimmed);
            }
        }
        if (newEmail != null && !newEmail.isBlank()) {
            String trimmed = newEmail.trim().toLowerCase();
            if (!trimmed.equals(user.getEmail())) {
                if (userRepository.existsByEmail(trimmed))
                    throw new IllegalArgumentException("Email already in use");
                user.setEmail(trimmed);
            }
        }
        userRepository.save(user);
        return getProfile(user.getEmail());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
