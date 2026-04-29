package com.kafkagui.cluster.dto;

public record ClusterInfo(
        String clusterId,
        Integer controllerId,
        int brokerCount,
        String kafkaVersion,
        int totalTopics,
        int totalPartitions,
        int underReplicatedPartitions,
        int offlinePartitions
) {}
