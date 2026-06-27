package com.geomaster.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GuessRequest {

    @NotBlank(message = "countryCode is required")
    private String countryCode;

    @NotNull(message = "isCorrect is required")
    private Boolean isCorrect;

    @NotNull(message = "timeTakenMs is required")
    @Min(value = 0, message = "timeTakenMs must be non-negative")
    private Long timeTakenMs;
}
