package com.kafkagui.broker.dto;

public record Broker(
        int id,
        String host,
        int port,
        String rack,
        boolean isController,
        int partitions,         // partition replicas hosted on this broker
        int leaders,            // partitions this broker leads
        int onlinePartitions,   // hosted replicas whose partition currently has a leader
        double partitionSkew,   // % deviation of hosted replicas from the cluster average
        double leaderSkew,      // % deviation of led partitions from the cluster average
        long diskBytes,         // total log size on this broker (-1 if unavailable)
        int logSegments         // replica log entries on this broker (proxy for segment count)
) {}
