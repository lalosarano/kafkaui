package com.kafkagui.consumer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

public record ResetOffsetsRequest(
        @NotBlank
        @Pattern(regexp = "earliest|latest|timestamp|offset", message = "strategy must be one of earliest|latest|timestamp|offset")
        String strategy,
        Long value,
        @NotBlank String topic,
        List<Integer> partitions
) {}
