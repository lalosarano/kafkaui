package com.kafkagui.message;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.confluent.kafka.schemaregistry.ParsedSchema;
import io.confluent.kafka.schemaregistry.client.SchemaRegistryClient;
import io.confluent.kafka.serializers.KafkaAvroDeserializer;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/**
 * Decodes raw Kafka payload bytes into a typed-ish JSON value.
 *
 * Algorithm:
 *   1. If payload starts with magic byte 0x00 + 4-byte schema id and we have
 *      a SchemaRegistryClient, try Avro deserialization.
 *   2. Else if bytes are valid UTF-8 and parse as JSON, return parsed JSON.
 *   3. Else if bytes are valid UTF-8 (printable), return the string.
 *   4. Else return base64.
 */
@Component
public class MessageDecoder {

    private final ObjectMapper mapper = new ObjectMapper();
    private final ObjectProvider<SchemaRegistryClient> registryProvider;
    private final KafkaAvroDeserializer avroDeser;

    public MessageDecoder(ObjectProvider<SchemaRegistryClient> registryProvider) {
        this.registryProvider = registryProvider;
        SchemaRegistryClient registry = registryProvider.getIfAvailable();
        this.avroDeser = registry != null ? new KafkaAvroDeserializer(registry) : null;
    }

    public record Decoded(Object value, String format, Integer schemaId) {}

    public Decoded decode(String topic, byte[] bytes) {
        if (bytes == null) return new Decoded(null, "null", null);

        // 1. Confluent magic-byte framed
        if (bytes.length >= 5 && bytes[0] == 0x0 && avroDeser != null) {
            try {
                int schemaId = ByteBuffer.wrap(bytes, 1, 4).getInt();
                Object obj = avroDeser.deserialize(topic, bytes);
                // Avro generic record won't be JSON-serializable directly; toString() is acceptable for v0.1.
                String json = obj.toString();
                try {
                    return new Decoded(mapper.readTree(json), "avro", schemaId);
                } catch (Exception ignore) {
                    return new Decoded(json, "avro", schemaId);
                }
            } catch (Exception ignore) {
                // fall through to other strategies
            }
        }

        // 2. JSON
        String s = new String(bytes, StandardCharsets.UTF_8);
        if (looksLikeJson(s)) {
            try {
                JsonNode node = mapper.readTree(s);
                return new Decoded(node, "json", null);
            } catch (Exception ignore) { /* fall through */ }
        }

        // 3. plain UTF-8
        if (isPrintableUtf8(bytes, s)) {
            return new Decoded(s, "text", null);
        }

        // 4. base64
        return new Decoded(Base64.getEncoder().encodeToString(bytes), "base64", null);
    }

    public String decodeKey(byte[] bytes) {
        if (bytes == null) return null;
        String s = new String(bytes, StandardCharsets.UTF_8);
        return isPrintableUtf8(bytes, s) ? s : Base64.getEncoder().encodeToString(bytes);
    }

    public byte[] encode(String value) {
        return value == null ? null : value.getBytes(StandardCharsets.UTF_8);
    }

    private boolean looksLikeJson(String s) {
        String t = s.strip();
        return !t.isEmpty() && (t.startsWith("{") || t.startsWith("["));
    }

    private boolean isPrintableUtf8(byte[] bytes, String decoded) {
        if (decoded.indexOf('�') >= 0) return false;
        for (int i = 0; i < decoded.length(); i++) {
            char c = decoded.charAt(i);
            if (c < 0x09 || (c > 0x0D && c < 0x20 && c != 0x1B)) return false;
        }
        return true;
    }
}
