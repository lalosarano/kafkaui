package com.kafkagui.config;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.ByteArrayDeserializer;
import org.springframework.stereotype.Component;

/**
 * Builds short-lived KafkaConsumer instances for ad-hoc operations
 * (historical message fetch, live tailing). Each consumer uses a unique
 * group id and manual seek, never auto-commits.
 */
@Component
public class ConsumerFactoryProvider {

    private final Map<String, Object> common;

    public ConsumerFactoryProvider(Map<String, Object> kafkaCommonProps) {
        this.common = kafkaCommonProps;
    }

    public KafkaConsumer<byte[], byte[]> create(String purpose) {
        Map<String, Object> p = new HashMap<>(common);
        p.put(ConsumerConfig.GROUP_ID_CONFIG, "kafka-gui-" + purpose + "-" + UUID.randomUUID());
        p.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ByteArrayDeserializer.class);
        p.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ByteArrayDeserializer.class);
        p.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "none");
        p.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        p.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 500);
        return new KafkaConsumer<>(p);
    }
}
