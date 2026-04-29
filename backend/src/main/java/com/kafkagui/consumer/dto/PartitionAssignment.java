package com.kafkagui.consumer.dto;

public record PartitionAssignment(
        String topic,
        int partition,
        Long currentOffset,
        Long endOffset,
        long lag,
        String memberId,
        String host
) {}
