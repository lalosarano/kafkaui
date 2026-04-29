package com.kafkagui.consumer.dto;

public record ConsumerGroupSummary(
        String id,
        String state,
        int members,
        long totalLag,
        String protocol,
        Integer coordinator
) {}
