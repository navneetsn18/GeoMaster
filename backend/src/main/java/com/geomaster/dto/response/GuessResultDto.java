package com.geomaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GuessResultDto {
    private boolean correct;
    private int pointsEarned;
    private int streakBonus;
    private int totalScore;
    private int currentStreak;
    private int bestStreak;
}
