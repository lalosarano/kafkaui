package com.kafkagui.broker.dto;

public record Broker(
        int id,
        String host,
        int port,
        String rack,
        boolean isController
) {}
