package com.kafkagui.topic.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.Map;

public record CreateTopicRequest(
        @NotBlank
        @Pattern(regexp = "[a-zA-Z0-9._\\-]{1,249}", message = "topic name must match Kafka name rules")
        String name,
        @Min(1) int partitions,
        @Min(1) int replicationFactor,
        Map<String, String> configs
) {}
