package com.kafkagui.netalias;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** JSON-file-backed list of {@link HostAlias} entries, thread-safe replace-all semantics. */
@Component
public class HostAliasStore {

    private static final Logger log = LoggerFactory.getLogger(HostAliasStore.class);
    private static final TypeReference<List<HostAlias>> LIST_TYPE = new TypeReference<>() {};

    private final ObjectMapper mapper = new ObjectMapper();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private final List<HostAlias> aliases = new ArrayList<>();
    private final Path storagePath;

    public HostAliasStore(@Value("${kafka-gui.host-aliases.path:/data/host-aliases.json}") String configuredPath) {
        this.storagePath = Path.of(configuredPath);
    }

    @PostConstruct
    void load() {
        lock.writeLock().lock();
        try {
            if (Files.exists(storagePath)) {
                List<HostAlias> loaded = mapper.readValue(Files.readAllBytes(storagePath), LIST_TYPE);
                aliases.clear();
                aliases.addAll(loaded);
                log.info("Loaded {} host alias(es) from {}", aliases.size(), storagePath);
            } else if (storagePath.getParent() != null) {
                Files.createDirectories(storagePath.getParent());
            }
            HostAliasRegistry.replaceAll(aliases);
        } catch (IOException e) {
            log.warn("Could not load host aliases from {}: {}", storagePath, e.getMessage());
        } finally {
            lock.writeLock().unlock();
        }
    }

    public List<HostAlias> list() {
        lock.readLock().lock();
        try { return new ArrayList<>(aliases); }
        finally { lock.readLock().unlock(); }
    }

    public List<HostAlias> replaceAll(List<HostAlias> next) {
        lock.writeLock().lock();
        try {
            aliases.clear();
            if (next != null) aliases.addAll(next);
            save();
            HostAliasRegistry.replaceAll(aliases);
            return new ArrayList<>(aliases);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void save() {
        try {
            byte[] bytes = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(aliases);
            if (storagePath.getParent() != null) Files.createDirectories(storagePath.getParent());
            Files.write(storagePath, bytes);
        } catch (IOException e) {
            log.error("Failed to persist host aliases to {}", storagePath, e);
            throw new RuntimeException("Could not persist host aliases: " + e.getMessage(), e);
        }
    }
}
