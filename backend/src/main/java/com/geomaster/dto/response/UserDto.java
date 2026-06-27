package com.geomaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String id;
    private String username;
    private String email;
    private String avatarUrl;
    private String role;
    // Public stats — populated when fetching following list
    private Long totalGames;
    private Integer bestScore;
    private Double avgAccuracy;
    private Integer bestStreak;
}
