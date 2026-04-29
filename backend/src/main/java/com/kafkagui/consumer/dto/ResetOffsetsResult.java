package com.kafkagui.consumer.dto;

import java.util.Map;

public record ResetOffsetsResult(
        String groupId,
        String topic,
        Map<Integer, Long> partitionOffsets
) {}
