package com.kafkagui.broker.dto;

public record BrokerConfigEntry(
        String name,
        String value,
        String source,
        boolean readOnly,
        boolean sensitive
) {}
