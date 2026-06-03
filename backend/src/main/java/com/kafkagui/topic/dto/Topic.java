package com.kafkagui.topic.dto;

public record Topic(
        String name,
        int partitions,
        int replicationFactor,
        boolean internal,
        long messages,    // sum of (latest - earliest) across partitions
        long sizeBytes    // leader-replica log size summed across partitions, -1 if unavailable
) {}
