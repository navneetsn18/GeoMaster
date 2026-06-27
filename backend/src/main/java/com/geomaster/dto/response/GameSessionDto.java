package com.geomaster.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameSessionDto {
    private String sessionId;
    private String mapType;
    private String regionCode;
    private List<CountryDto> countries;
    private int totalCountries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CountryDto {
        private String code;
        private String name;
        private String flagUrl;
    }
}
