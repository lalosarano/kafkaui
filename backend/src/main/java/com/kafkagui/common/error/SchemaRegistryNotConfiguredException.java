package com.kafkagui.common.error;

public class SchemaRegistryNotConfiguredException extends RuntimeException {
    public SchemaRegistryNotConfiguredException() {
        super("Schema Registry URL is not configured (kafka-gui.schema-registry.url)");
    }
}
