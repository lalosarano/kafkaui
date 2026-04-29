package com.kafkagui.metrics.dto;

import java.util.List;

public record ThroughputSeries(
        List<Long> timestamps,        // epoch ms, oldest → newest
        List<Double> messagesInPerSec,
        List<Double> messagesOutPerSec,
        List<Double> bytesInPerSec,
        List<Double> bytesOutPerSec,
        List<TopTopic> topTopics      // top N by current msgs/s
) {
    public record TopTopic(
            String name,
            int partitions,
            long totalMessages,
            double messagesPerSec,
            double bytesPerSec,
            long lag,
            List<Double> sparkline
    ) {}
}
