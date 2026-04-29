package com.kafkagui.schema.dto;

public record SchemaVersion(
        String subject,
        int id,
        int version,
        String schema,
        String schemaType,
        String compatibility
) {}
