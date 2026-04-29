package com.kafkagui.topic.dto;

public record Topic(
        String name,
        int partitions,
        int replicationFactor,
        boolean internal
) {}
