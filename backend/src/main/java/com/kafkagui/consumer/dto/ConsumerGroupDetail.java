package com.kafkagui.consumer.dto;

import java.util.List;

public record ConsumerGroupDetail(
        String id,
        String state,
        String protocol,
        Integer coordinator,
        long totalLag,
        List<ConsumerGroupMember> members,
        List<PartitionAssignment> assignments
) {}
