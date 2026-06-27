package com.geomaster.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * In-memory result of processing a single guess within a game session.
 * Used internally by GameService; the HTTP layer maps this to GuessResultDto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuessResult {
    private boolean correct;
    private int pointsEarned;
    private double streakMultiplier;
    private int currentStreak;
    private int bestStreak;
    private int currentScore;
}
