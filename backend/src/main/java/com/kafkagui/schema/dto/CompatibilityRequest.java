package com.kafkagui.schema.dto;

import jakarta.validation.constraints.NotBlank;

public record CompatibilityRequest(
        @NotBlank String schema,
        String schemaType
) {}
