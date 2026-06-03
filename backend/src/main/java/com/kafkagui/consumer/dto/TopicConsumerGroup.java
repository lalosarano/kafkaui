package com.kafkagui.consumer.dto;

/** A consumer group that has committed offsets on a given topic, with that topic's lag. */
public record TopicConsumerGroup(
        String groupId,
        String state,
        int members,
        long lag,
        int assignedPartitions
) {}
