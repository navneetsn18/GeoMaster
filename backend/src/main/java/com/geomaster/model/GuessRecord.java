package com.geomaster.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "guess_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuessRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, length = 36)
    private String id;

    @Column(name = "session_id", nullable = false, length = 36)
    private String sessionId;

    @Column(name = "country_code", nullable = false, length = 10)
    private String countryCode;

    @Column(name = "is_correct", nullable = false)
    private boolean correct;

    @Column(name = "time_taken_ms", nullable = false)
    private int timeTakenMs;

    @Column(name = "points_earned")
    @Builder.Default
    private int pointsEarned = 0;

    @CreationTimestamp
    @Column(name = "guessed_at", updatable = false)
    private Instant guessedAt;
}
