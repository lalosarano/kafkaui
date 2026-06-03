package com.kafkagui.cluster;

import com.kafkagui.cluster.dto.ClusterConfig;
import com.kafkagui.cluster.dto.ClusterTestResult;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cluster-configs")
public class ClusterConfigController {

    private final ClusterConfigStore store;
    private final ClusterRegistry registry;

    public ClusterConfigController(ClusterConfigStore store, ClusterRegistry registry) {
        this.store = store;
        this.registry = registry;
    }

    @GetMapping
    public List<ClusterConfig> list() {
        return store.list().stream().map(ClusterConfig::redacted).toList();
    }

    @GetMapping("/{id}")
    public ClusterConfig get(@PathVariable String id) {
        return store.get(id).map(ClusterConfig::redacted)
                .orElseThrow(() -> new IllegalArgumentException("Unknown cluster id: " + id));
    }

    @PostMapping
    public ClusterConfig create(@Valid @RequestBody ClusterConfig req) {
        ClusterConfig saved = store.add(req);
        return saved.redacted();
    }

    @PutMapping("/{id}")
    public ClusterConfig update(@PathVariable String id, @Valid @RequestBody ClusterConfig req) {
        ClusterConfig saved = store.update(id, req);
        registry.evict(id); // force rebuild on next request, picking up new bootstrap/security
        return saved.redacted();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        registry.evict(id);
        boolean removed = store.delete(id);
        return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/test")
    public ClusterTestResult test(@RequestBody ClusterConfig req) {
        // No @Valid here: a connection probe only needs bootstrapServers, not a display
        // name. Requiring the name would reject the request before the user can verify
        // their broker is reachable.
        return registry.test(req, 5000);
    }
}
