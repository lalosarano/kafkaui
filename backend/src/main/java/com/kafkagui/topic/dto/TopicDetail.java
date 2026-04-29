package com.kafkagui.topic.dto;

import java.util.List;

public record TopicDetail(
        String name,
        boolean internal,
        int replicationFactor,
        List<Partition> partitions,
        List<TopicConfigEntry> configs
) {}
