package com.kafkagui.cluster;

import com.kafkagui.cluster.dto.ClusterConfig;
import com.kafkagui.cluster.dto.ClusterTestResult;
import io.confluent.kafka.schemaregistry.client.CachedSchemaRegistryClient;
import io.confluent.kafka.schemaregistry.client.SchemaRegistryClient;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.Collection;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.config.SslConfigs;
import org.apache.kafka.common.serialization.ByteArraySerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/** Pools an AdminClient + Producer + SchemaRegistryClient per cluster id. */
@Component
public class ClusterRegistry {

    private static final Logger log = LoggerFactory.getLogger(ClusterRegistry.class);

    public record ClusterClients(AdminClient admin, Producer<byte[], byte[]> producer, SchemaRegistryClient schemaRegistry) {
        public void close() {
            try { if (admin != null) admin.close(Duration.ofSeconds(2)); } catch (Exception ignored) {}
            try { if (producer != null) producer.close(Duration.ofSeconds(2)); } catch (Exception ignored) {}
            // SchemaRegistryClient does not implement Closeable
        }
    }

    private final ConcurrentHashMap<String, ClusterClients> pool = new ConcurrentHashMap<>();
    private final ClusterConfigStore store;

    public ClusterRegistry(ClusterConfigStore store) {
        this.store = store;
    }

    @PostConstruct
    void prewarm() {
        // Don't actually connect on startup — let it happen lazily on first request.
        // (Keeps the backend bootable even when configured clusters are temporarily unreachable.)
    }

    @PreDestroy
    void shutdown() {
        pool.values().forEach(ClusterClients::close);
        pool.clear();
    }

    public AdminClient adminClient(String clusterId) {
        return get(clusterId).admin();
    }

    public Producer<byte[], byte[]> producer(String clusterId) {
        return get(clusterId).producer();
    }

    public SchemaRegistryClient schemaRegistry(String clusterId) {
        return get(clusterId).schemaRegistry();
    }

    public ClusterConfig config(String clusterId) {
        return store.get(clusterId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown cluster id: " + clusterId));
    }

    public synchronized void evict(String clusterId) {
        ClusterClients removed = pool.remove(clusterId);
        if (removed != null) removed.close();
    }

    public Collection<String> activeClusterIds() { return pool.keySet(); }

    private ClusterClients get(String clusterId) {
        if (clusterId == null) throw new IllegalStateException("No cluster id available — set X-Cluster-Id header");
        return pool.computeIfAbsent(clusterId, id -> {
            ClusterConfig cfg = config(id);
            log.info("Building Kafka client pool for cluster '{}': {}", id, cfg.bootstrapServers());
            return new ClusterClients(
                    buildAdminClient(cfg, 30_000),
                    buildProducer(cfg),
                    buildSchemaRegistry(cfg)
            );
        });
    }

    private static Properties commonProps(ClusterConfig cfg, int requestTimeoutMs) {
        Properties p = new Properties();
        p.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, cfg.bootstrapServers());
        p.put(AdminClientConfig.CLIENT_ID_CONFIG, "kafka-gui-" + cfg.id());
        p.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, requestTimeoutMs);
        p.put(AdminClientConfig.SECURITY_PROTOCOL_CONFIG, cfg.safeSecurityProtocol());
        if (StringUtils.hasText(cfg.saslMechanism())) p.put(SaslConfigs.SASL_MECHANISM, cfg.saslMechanism());
        if (StringUtils.hasText(cfg.saslJaasConfig())) p.put(SaslConfigs.SASL_JAAS_CONFIG, cfg.saslJaasConfig());
        if (StringUtils.hasText(cfg.sslTruststoreLocation())) p.put(SslConfigs.SSL_TRUSTSTORE_LOCATION_CONFIG, cfg.sslTruststoreLocation());
        if (StringUtils.hasText(cfg.sslTruststorePassword())) p.put(SslConfigs.SSL_TRUSTSTORE_PASSWORD_CONFIG, cfg.sslTruststorePassword());
        return p;
    }

    private static AdminClient buildAdminClient(ClusterConfig cfg, int requestTimeoutMs) {
        return AdminClient.create(commonProps(cfg, requestTimeoutMs));
    }

    /**
     * AdminClient tuned for a one-shot reachability probe: it must fail fast against an
     * unreachable broker instead of retrying for the default 60s api timeout. Bounds the
     * overall api timeout and the per-connection TCP setup timeout to the probe budget.
     */
    private static AdminClient buildProbeAdminClient(ClusterConfig cfg, int timeoutMs) {
        Properties p = commonProps(cfg, timeoutMs);
        p.put(AdminClientConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, timeoutMs);
        p.put(AdminClientConfig.RECONNECT_BACKOFF_MAX_MS_CONFIG, 1000);
        p.put("socket.connection.setup.timeout.ms", Math.min(2000, timeoutMs));
        p.put("socket.connection.setup.timeout.max.ms", timeoutMs);
        return AdminClient.create(p);
    }

    private static Producer<byte[], byte[]> buildProducer(ClusterConfig cfg) {
        Properties p = commonProps(cfg, 30_000);
        p.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
        p.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
        p.put(ProducerConfig.ACKS_CONFIG, "all");
        p.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "zstd");
        p.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        return new KafkaProducer<>(p);
    }

    private static SchemaRegistryClient buildSchemaRegistry(ClusterConfig cfg) {
        if (!StringUtils.hasText(cfg.schemaRegistryUrl())) return null;
        return new CachedSchemaRegistryClient(cfg.schemaRegistryUrl(), 256);
    }

    /**
     * Probe-only: builds a short-lived AdminClient against the supplied config and
     * runs describeCluster() with a fixed deadline. Never persists anything.
     */
    public ClusterTestResult test(ClusterConfig cfg, long timeoutMs) {
        long start = System.currentTimeMillis();
        AdminClient admin = null;
        try {
            admin = buildProbeAdminClient(cfg.id() == null ? cfg.withId("__probe__") : cfg, (int) timeoutMs);
            DescribeClusterResult res = admin.describeCluster();
            var nodes = res.nodes().get(timeoutMs, TimeUnit.MILLISECONDS);
            var controller = res.controller().get(timeoutMs, TimeUnit.MILLISECONDS);
            var clusterId = res.clusterId().get(timeoutMs, TimeUnit.MILLISECONDS);
            return ClusterTestResult.success(
                    nodes.size(),
                    controller != null ? controller.id() : null,
                    clusterId,
                    System.currentTimeMillis() - start);
        } catch (TimeoutException e) {
            return ClusterTestResult.failure("kafka-timeout", "Connection timed out after " + timeoutMs + "ms");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ClusterTestResult.failure("interrupted", "Probe interrupted");
        } catch (Exception e) {
            Throwable cause = e;
            while (cause.getCause() != null && cause.getCause() != cause) cause = cause.getCause();
            return ClusterTestResult.failure(cause.getClass().getSimpleName(), cause.getMessage());
        } finally {
            // Close hard: describeCluster() may still be retrying against an unreachable
            // broker, and a no-arg close() would block until those calls expire (~60s),
            // making the endpoint hang long after our own deadline fired.
            if (admin != null) admin.close(Duration.ofMillis(500));
        }
    }
}
