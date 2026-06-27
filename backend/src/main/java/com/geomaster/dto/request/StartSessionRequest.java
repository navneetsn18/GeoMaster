package com.geomaster.dto.request;

import com.geomaster.model.enums.MapType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartSessionRequest {

    @NotNull(message = "mapType is required")
    private MapType mapType;

    private String regionCode;
}
