package com.kafkagui.message.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record ProduceRequest(
        String key,
        @NotNull String value,
        Map<String, String> headers,
        Integer partition
) {}
