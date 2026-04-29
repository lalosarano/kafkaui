package com.kafkagui.config;

import com.kafkagui.cluster.ClusterConfigStore;
import com.kafkagui.cluster.dto.ClusterConfig;
import java.util.Properties;
import java.util.UUID;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.config.SslConfigs;
import org.apache.kafka.common.serialization.ByteArrayDeserializer;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Builds short-lived KafkaConsumer instances for ad-hoc operations
 * (historical message fetch, live tailing) against any registered cluster.
 * Each consumer uses a unique group id, never auto-commits, and manually seeks.
 */
@Component
public class ConsumerFactoryProvider {

    private final ClusterConfigStore store;

    public ConsumerFactoryProvider(ClusterConfigStore store) {
        this.store = store;
    }

    public KafkaConsumer<byte[], byte[]> create(String clusterId, String purpose) {
        ClusterConfig cfg = store.get(clusterId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown cluster id: " + clusterId));
        Properties p = new Properties();
        p.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, cfg.bootstrapServers());
        p.put(ConsumerConfig.CLIENT_ID_CONFIG, "kafka-gui-" + clusterId + "-" + purpose);
        p.put(ConsumerConfig.GROUP_ID_CONFIG, "kafka-gui-" + purpose + "-" + UUID.randomUUID());
        p.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ByteArrayDeserializer.class.getName());
        p.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ByteArrayDeserializer.class.getName());
        p.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "none");
        p.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        p.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
        p.put("security.protocol", cfg.safeSecurityProtocol());
        if (StringUtils.hasText(cfg.saslMechanism())) p.put(SaslConfigs.SASL_MECHANISM, cfg.saslMechanism());
        if (StringUtils.hasText(cfg.saslJaasConfig())) p.put(SaslConfigs.SASL_JAAS_CONFIG, cfg.saslJaasConfig());
        if (StringUtils.hasText(cfg.sslTruststoreLocation())) p.put(SslConfigs.SSL_TRUSTSTORE_LOCATION_CONFIG, cfg.sslTruststoreLocation());
        if (StringUtils.hasText(cfg.sslTruststorePassword())) p.put(SslConfigs.SSL_TRUSTSTORE_PASSWORD_CONFIG, cfg.sslTruststorePassword());
        return new KafkaConsumer<>(p);
    }
}
