package com.kafkagui.netalias;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * A user-supplied hostname → IP override applied JVM-wide via {@link KafkaGuiResolverProvider}.
 * Mirrors a single line of /etc/hosts; multiple entries with the same hostname produce
 * round-robin resolution (same as the hosts file).
 */
public record HostAlias(
        @NotBlank
        @Pattern(regexp = "[A-Za-z0-9._\\-]{1,253}", message = "hostname must be 1-253 chars: letters, digits, dot, dash, underscore")
        String hostname,
        @NotBlank
        @Pattern(regexp = "[0-9a-fA-F.:]{2,45}", message = "ip must be a numeric IPv4 or IPv6 literal")
        String ip
) {
}
