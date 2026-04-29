package com.kafkagui.message;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.JsonNode;
import io.confluent.kafka.schemaregistry.client.SchemaRegistryClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.context.support.GenericApplicationContext;

class MessageDecoderTest {

    private final MessageDecoder decoder = new MessageDecoder(new EmptyProvider());

    @Test
    void decodes_json_object() {
        var d = decoder.decode("t", "{\"x\":1,\"y\":\"a\"}".getBytes());
        assertEquals("json", d.format());
        assertNull(d.schemaId());
        assertInstanceOf(JsonNode.class, d.value());
        assertEquals(1, ((JsonNode) d.value()).get("x").asInt());
    }

    @Test
    void decodes_plain_text() {
        var d = decoder.decode("t", "hello world".getBytes());
        assertEquals("text", d.format());
        assertEquals("hello world", d.value());
    }

    @Test
    void falls_back_to_base64_for_binary_payloads() {
        byte[] bytes = new byte[]{0x10, 0x00, 0x01, 0x05, 0x7f, (byte) 0xff};
        var d = decoder.decode("t", bytes);
        assertEquals("base64", d.format());
        assertNotNull(d.value());
    }

    @Test
    void decodes_null_payload_to_null() {
        var d = decoder.decode("t", null);
        assertEquals("null", d.format());
        assertNull(d.value());
    }

    @Test
    void decode_key_returns_string_for_utf8() {
        assertEquals("key-1", decoder.decodeKey("key-1".getBytes()));
    }

    @Test
    void decode_key_falls_back_to_base64_for_binary() {
        String s = decoder.decodeKey(new byte[]{0x00, (byte) 0xff, (byte) 0xfe});
        assertNotNull(s);
        assertNotEquals("", s);
    }

    /** Empty provider that returns null — same shape Spring would give us if registry is unconfigured. */
    static class EmptyProvider implements ObjectProvider<SchemaRegistryClient> {
        @Override public SchemaRegistryClient getIfAvailable() { return null; }
        @Override public SchemaRegistryClient getIfUnique() { return null; }
        @Override public SchemaRegistryClient getObject() { throw new UnsupportedOperationException(); }
        @Override public SchemaRegistryClient getObject(Object... args) { throw new UnsupportedOperationException(); }
    }
}
