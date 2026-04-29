package com.kafkagui.alert.dto;

public record Alert(
        String id,
        String severity,    // info | warning | error
        String title,
        String body,
        String resource,
        long ts
) {}
