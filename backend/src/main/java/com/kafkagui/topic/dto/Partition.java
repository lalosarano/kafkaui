package com.kafkagui.topic.dto;

import java.util.List;

public record Partition(
        int partition,
        Integer leader,
        List<Integer> replicas,
        List<Integer> isr,
        long beginOffset,
        long endOffset
) {}
