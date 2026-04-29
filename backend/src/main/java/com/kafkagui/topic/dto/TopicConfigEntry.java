package com.kafkagui.topic.dto;

public record TopicConfigEntry(
        String name,
        String value,
        String source,
        boolean readOnly,
        boolean sensitive
) {}
