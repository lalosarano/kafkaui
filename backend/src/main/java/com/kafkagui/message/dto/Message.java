package com.kafkagui.message.dto;

import java.util.Map;

public record Message(
        String topic,
        int partition,
        long offset,
        long timestamp,
        String key,
        Object value,
        String valueFormat,    // json | text | base64 | avro | protobuf
        Integer schemaId,
        int sizeBytes,
        Map<String, String> headers
) {}
