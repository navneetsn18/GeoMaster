package com.geomaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameCompleteDto {
    private String sessionId;
    private int score;
    private int correctCount;
    private int totalCount;
    private double accuracy;
    private long timeTaken; // seconds
    private int bestStreak;
    private boolean newPersonalBest;
}
