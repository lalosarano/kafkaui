package com.kafkagui.consumer.dto;

import java.util.List;

public record ConsumerGroupMember(
        String memberId,
        String clientId,
        String host,
        List<String> assignments
) {}
