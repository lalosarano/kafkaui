package com.kafkagui.netalias;

import com.kafkagui.cluster.ClusterRegistry;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/host-aliases")
public class HostAliasController {

    private static final Pattern HOSTNAME = Pattern.compile("[A-Za-z0-9._\\-]{1,253}");
    private static final Pattern IP_LITERAL = Pattern.compile("[0-9a-fA-F.:]{2,45}");

    private final HostAliasStore store;
    private final ClusterRegistry clusterRegistry;

    public HostAliasController(HostAliasStore store, ClusterRegistry clusterRegistry) {
        this.store = store;
        this.clusterRegistry = clusterRegistry;
    }

    @GetMapping
    public List<HostAlias> list() {
        return store.list();
    }

    @PutMapping
    public List<HostAlias> replace(@RequestBody List<HostAlias> body) {
        List<HostAlias> input = body == null ? List.of() : body;
        for (int i = 0; i < input.size(); i++) {
            HostAlias a = input.get(i);
            if (a == null || a.hostname() == null || a.hostname().isBlank()) {
                throw new IllegalArgumentException("Entry " + i + ": hostname is required");
            }
            if (a.ip() == null || a.ip().isBlank()) {
                throw new IllegalArgumentException("Entry " + i + " (" + a.hostname() + "): ip is required");
            }
            if (!HOSTNAME.matcher(a.hostname()).matches()) {
                throw new IllegalArgumentException("Entry " + i + ": invalid hostname '" + a.hostname() + "'");
            }
            if (!IP_LITERAL.matcher(a.ip()).matches()) {
                throw new IllegalArgumentException("Entry " + i + " (" + a.hostname() + "): '" + a.ip()
                        + "' is not a numeric IPv4 or IPv6 literal");
            }
        }
        List<HostAlias> saved = store.replaceAll(input);
        // Force Kafka clients to rebuild so the new resolver mapping takes effect on the next request.
        // (The 30s JVM DNS cache means existing sockets may still hold the old IP until they reconnect.)
        for (String clusterId : new ArrayList<>(clusterRegistry.activeClusterIds())) {
            clusterRegistry.evict(clusterId);
        }
        return saved;
    }
}
