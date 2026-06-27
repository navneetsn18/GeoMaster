package com.geomaster.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "game_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, length = 36)
    private String id;

    /**
     * Stored as the user's UUID string. Maps to user_id FK column.
     */
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    /**
     * Stored as a string ("WORLD", "AFRICA", etc.) to support H2 test profile
     * without needing PostgreSQL enum types.
     */
    @Column(name = "map_type", nullable = false, length = 20)
    private String mapType;

    @Column(name = "region_code", length = 10)
    private String regionCode;

    /**
     * Persisted status string: IN_PROGRESS, COMPLETED, ABANDONED.
     * The `completed` field (transient) is derived from this on load.
     */
    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "IN_PROGRESS";

    /**
     * Transient convenience flag set by @PostLoad and the builder.
     * Unit tests build sessions with .completed(true); production uses @PostLoad.
     */
    @Transient
    @Builder.Default
    private boolean completed = false;

    @Column(name = "total_score")
    @Builder.Default
    private int finalScore = 0;

    @Column(name = "correct_count")
    @Builder.Default
    private int correctCount = 0;

    @Column(name = "total_count")
    @Builder.Default
    private int totalCount = 0;

    @Column(name = "best_streak")
    @Builder.Default
    private int bestStreak = 0;

    @Column(name = "current_streak")
    @Builder.Default
    private int currentStreak = 0;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "flag_count", nullable = false)
    @Builder.Default
    private int flagCount = 0;

    @PostLoad
    void syncCompleted() {
        this.completed = "COMPLETED".equals(this.status);
    }

    public void complete() {
        this.status = "COMPLETED";
        this.completed = true;
        this.completedAt = Instant.now();
    }
}
