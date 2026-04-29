package com.kafkagui.message.dto;

public record ProduceResult(
        String topic,
        int partition,
        long offset,
        long timestamp
) {}
