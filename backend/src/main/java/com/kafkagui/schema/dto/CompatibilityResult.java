package com.kafkagui.schema.dto;

import java.util.List;

public record CompatibilityResult(
        boolean isCompatible,
        List<String> messages
) {}
