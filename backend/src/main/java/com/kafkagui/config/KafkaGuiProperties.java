package com.kafkagui.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kafka-gui")
public record KafkaGuiProperties(
        String bootstrapServers,
        String clientId,
        Integer requestTimeoutMs,
        String securityProtocol,
        String saslMechanism,
        String saslJaasConfig,
        String sslTruststoreLocation,
        String sslTruststorePassword,
        SchemaRegistry schemaRegistry,
        Cors cors,
        Message message,
        Ws ws
) {
    public record SchemaRegistry(String url, Integer cacheCapacity) {}
    public record Cors(String allowedOrigins) {}
    public record Message(Integer maxPollRecords, Integer pollTimeoutMs, Integer historicalFetchTimeoutMs) {}
    public record Ws(Integer lagBroadcastIntervalMs, Integer tailBufferSize) {}
}
