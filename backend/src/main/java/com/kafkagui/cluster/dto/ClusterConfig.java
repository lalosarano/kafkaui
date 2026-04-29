package com.kafkagui.cluster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * A user-supplied Kafka cluster connection. Persisted to /data/clusters.json.
 * Sensitive fields are stored in plaintext for v0.1 — encrypted-at-rest is a P1 followup
 * once auth lands.
 */
public record ClusterConfig(
        @Pattern(regexp = "[a-zA-Z0-9._\\-]{1,64}", message = "id must be 1-64 chars: letters, digits, dot, dash, underscore")
        String id,
        @NotBlank String name,
        String color,
        @NotBlank String bootstrapServers,
        String securityProtocol,
        String saslMechanism,
        String saslJaasConfig,
        String sslTruststoreLocation,
        String sslTruststorePassword,
        String schemaRegistryUrl
) {
    public ClusterConfig withId(String newId) {
        return new ClusterConfig(newId, name, color, bootstrapServers,
                securityProtocol, saslMechanism, saslJaasConfig,
                sslTruststoreLocation, sslTruststorePassword, schemaRegistryUrl);
    }
    public String safeSecurityProtocol() {
        return securityProtocol == null || securityProtocol.isBlank() ? "PLAINTEXT" : securityProtocol;
    }
    /** Mask sensitive fields for outbound responses. */
    public ClusterConfig redacted() {
        return new ClusterConfig(id, name, color, bootstrapServers, securityProtocol,
                saslMechanism,
                saslJaasConfig != null && !saslJaasConfig.isBlank() ? "***" : null,
                sslTruststoreLocation,
                sslTruststorePassword != null && !sslTruststorePassword.isBlank() ? "***" : null,
                schemaRegistryUrl);
    }
}
