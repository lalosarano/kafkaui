package com.kafkagui.config;

import io.confluent.kafka.schemaregistry.client.CachedSchemaRegistryClient;
import io.confluent.kafka.schemaregistry.client.SchemaRegistryClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SchemaRegistryConfig {

    /** Only created when kafka-gui.schema-registry.url is set. */
    @Bean
    @ConditionalOnProperty(prefix = "kafka-gui.schema-registry", name = "url")
    public SchemaRegistryClient schemaRegistryClient(KafkaGuiProperties props) {
        int capacity = props.schemaRegistry() != null && props.schemaRegistry().cacheCapacity() != null
                ? props.schemaRegistry().cacheCapacity()
                : 256;
        return new CachedSchemaRegistryClient(props.schemaRegistry().url(), capacity);
    }
}
