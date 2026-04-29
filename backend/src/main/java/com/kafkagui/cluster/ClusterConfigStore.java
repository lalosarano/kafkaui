package com.kafkagui.cluster;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kafkagui.cluster.dto.ClusterConfig;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** JSON-file-backed cluster registry, thread-safe CRUD, seeds a "default" cluster from env on first run. */
@Component
public class ClusterConfigStore {

    private static final Logger log = LoggerFactory.getLogger(ClusterConfigStore.class);
    private static final TypeReference<List<ClusterConfig>> LIST_TYPE = new TypeReference<>() {};

    private final ObjectMapper mapper = new ObjectMapper();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final Map<String, ClusterConfig> configs = new LinkedHashMap<>();

    private final Path storagePath;
    private final String bootstrapClusterServers;
    private final String bootstrapSchemaRegistryUrl;

    public ClusterConfigStore(
            @Value("${kafka-gui.cluster-store.path:/data/clusters.json}") String configuredPath,
            @Value("${kafka-gui.bootstrap-servers:}") String bootstrapClusterServers,
            @Value("${kafka-gui.schema-registry.url:}") String bootstrapSchemaRegistryUrl) {
        this.storagePath = Path.of(configuredPath);
        this.bootstrapClusterServers = bootstrapClusterServers;
        this.bootstrapSchemaRegistryUrl = bootstrapSchemaRegistryUrl;
    }

    @PostConstruct
    void load() {
        lock.writeLock().lock();
        try {
            if (Files.exists(storagePath)) {
                List<ClusterConfig> loaded = mapper.readValue(Files.readAllBytes(storagePath), LIST_TYPE);
                for (ClusterConfig c : loaded) configs.put(c.id(), c);
                log.info("Loaded {} cluster config(s) from {}", configs.size(), storagePath);
            } else {
                log.info("No cluster config file at {}, starting empty", storagePath);
                if (storagePath.getParent() != null) Files.createDirectories(storagePath.getParent());
            }
            // Seed a default cluster from application.yml so the existing dev flow still works without UI setup.
            if (configs.isEmpty() && bootstrapClusterServers != null && !bootstrapClusterServers.isBlank()) {
                ClusterConfig def = new ClusterConfig(
                        "default", "Default", "#7c9cff",
                        bootstrapClusterServers, "PLAINTEXT", null, null, null, null,
                        bootstrapSchemaRegistryUrl == null || bootstrapSchemaRegistryUrl.isBlank() ? null : bootstrapSchemaRegistryUrl
                );
                configs.put(def.id(), def);
                save();
                log.info("Seeded default cluster from env: {}", bootstrapClusterServers);
            }
        } catch (IOException e) {
            log.warn("Could not load cluster configs from {}: {}", storagePath, e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<ClusterConfig> list() {
        lock.readLock().lock();
        try { return new ArrayList<>(configs.values()); }
        finally { lock.readLock().unlock(); }
    }

    public Optional<ClusterConfig> get(String id) {
        lock.readLock().lock();
        try { return Optional.ofNullable(configs.get(id)); }
        finally { lock.readLock().unlock(); }
    }

    public ClusterConfig add(ClusterConfig cfg) {
        lock.writeLock().lock();
        try {
            if (cfg.id() == null || cfg.id().isBlank()) {
                cfg = cfg.withId(slugify(cfg.name()));
            }
            if (configs.containsKey(cfg.id())) {
                throw new IllegalArgumentException("Cluster with id '" + cfg.id() + "' already exists");
            }
            configs.put(cfg.id(), cfg);
            save();
            return cfg;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public ClusterConfig update(String id, ClusterConfig cfg) {
        lock.writeLock().lock();
        try {
            if (!configs.containsKey(id)) {
                throw new IllegalArgumentException("Cluster '" + id + "' does not exist");
            }
            ClusterConfig stored = cfg.withId(id);
            configs.put(id, stored);
            save();
            return stored;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public boolean delete(String id) {
        lock.writeLock().lock();
        try {
            ClusterConfig removed = configs.remove(id);
            if (removed != null) save();
            return removed != null;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public Optional<String> defaultClusterId() {
        lock.readLock().lock();
        try { return configs.keySet().stream().findFirst(); }
        finally { lock.readLock().unlock(); }
    }

    private void save() {
        try {
            byte[] bytes = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(new ArrayList<>(configs.values()));
            if (storagePath.getParent() != null) Files.createDirectories(storagePath.getParent());
            Files.write(storagePath, bytes);
        } catch (IOException e) {
            log.error("Failed to persist cluster configs to {}", storagePath, e);
            throw new RuntimeException("Could not persist cluster config: " + e.getMessage(), e);
        }
    }

    private static String slugify(String s) {
        if (s == null) return "cluster-" + System.currentTimeMillis();
        String slug = s.toLowerCase().replaceAll("[^a-z0-9._\\-]+", "-").replaceAll("^-+|-+$", "");
        return slug.isBlank() ? "cluster-" + System.currentTimeMillis() : slug;
    }
}
