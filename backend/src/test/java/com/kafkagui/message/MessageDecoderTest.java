package com.kafkagui.message;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.JsonNode;
import com.kafkagui.cluster.ClusterRegistry;
import org.junit.jupiter.api.Test;

class MessageDecoderTest {

    private final ClusterRegistry registry = mock(ClusterRegistry.class);
    private final MessageDecoder decoder = new MessageDecoder(registry);

    @Test
    void decodes_json_object() {
        when(registry.schemaRegistry("c1")).thenReturn(null);
        var d = decoder.decode("c1", "t", "{\"x\":1,\"y\":\"a\"}".getBytes());
        assertEquals("json", d.format());
        assertNull(d.schemaId());
        assertInstanceOf(JsonNode.class, d.value());
        assertEquals(1, ((JsonNode) d.value()).get("x").asInt());
    }

    @Test
    void decodes_plain_text() {
        var d = decoder.decode("c1", "t", "hello world".getBytes());
        assertEquals("text", d.format());
        assertEquals("hello world", d.value());
    }

    @Test
    void falls_back_to_base64_for_binary_payloads() {
        byte[] bytes = new byte[]{0x10, 0x00, 0x01, 0x05, 0x7f, (byte) 0xff};
        var d = decoder.decode("c1", "t", bytes);
        assertEquals("base64", d.format());
        assertNotNull(d.value());
    }

    @Test
    void decodes_null_payload_to_null() {
        var d = decoder.decode("c1", "t", null);
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
}
