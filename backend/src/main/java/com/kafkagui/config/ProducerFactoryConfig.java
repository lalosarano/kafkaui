package com.kafkagui.config;

import java.util.Properties;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.ByteArraySerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProducerFactoryConfig {

    @Bean(destroyMethod = "close")
    public Producer<byte[], byte[]> kafkaProducer(KafkaAdminConfig.KafkaProps kafkaCommonProps) {
        Properties p = new Properties();
        p.putAll(kafkaCommonProps);
        p.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
        p.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
        p.put(ProducerConfig.ACKS_CONFIG, "all");
        p.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "zstd");
        p.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        return new KafkaProducer<>(p);
    }
}
