package com.kafkagui.schema;

import com.kafkagui.common.error.SchemaRegistryNotConfiguredException;
import com.kafkagui.schema.dto.CompatibilityRequest;
import com.kafkagui.schema.dto.CompatibilityResult;
import com.kafkagui.schema.dto.SchemaVersion;
import io.confluent.kafka.schemaregistry.ParsedSchema;
import io.confluent.kafka.schemaregistry.avro.AvroSchemaProvider;
import io.confluent.kafka.schemaregistry.client.SchemaMetadata;
import io.confluent.kafka.schemaregistry.client.SchemaRegistryClient;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class SchemaService {

    private final ObjectProvider<SchemaRegistryClient> registryProvider;

    public SchemaService(ObjectProvider<SchemaRegistryClient> registryProvider) {
        this.registryProvider = registryProvider;
    }

    private SchemaRegistryClient client() {
        SchemaRegistryClient c = registryProvider.getIfAvailable();
        if (c == null) throw new SchemaRegistryNotConfiguredException();
        return c;
    }

    public List<String> subjects() {
        try {
            Collection<String> all = client().getAllSubjects();
            List<String> sorted = new ArrayList<>(all);
            sorted.sort(String::compareTo);
            return sorted;
        } catch (Exception e) {
            throw new RuntimeException("Failed to list subjects: " + e.getMessage(), e);
        }
    }

    public List<Integer> versions(String subject) {
        try {
            return client().getAllVersions(subject);
        } catch (Exception e) {
            throw new RuntimeException("Failed to list versions: " + e.getMessage(), e);
        }
    }

    public SchemaVersion get(String subject, int version) {
        try {
            SchemaMetadata md = client().getSchemaMetadata(subject, version);
            String compat = safeGetCompatibility(subject);
            return new SchemaVersion(subject, md.getId(), md.getVersion(), md.getSchema(),
                    md.getSchemaType() != null ? md.getSchemaType() : "AVRO", compat);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch schema version: " + e.getMessage(), e);
        }
    }

    public SchemaVersion latest(String subject) {
        try {
            SchemaMetadata md = client().getLatestSchemaMetadata(subject);
            String compat = safeGetCompatibility(subject);
            return new SchemaVersion(subject, md.getId(), md.getVersion(), md.getSchema(),
                    md.getSchemaType() != null ? md.getSchemaType() : "AVRO", compat);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch latest schema: " + e.getMessage(), e);
        }
    }

    public CompatibilityResult checkCompatibility(String subject, CompatibilityRequest req) {
        try {
            String type = req.schemaType() != null ? req.schemaType() : "AVRO";
            ParsedSchema parsed = parseSchema(req.schema(), type);
            boolean ok = client().testCompatibility(subject, parsed);
            return new CompatibilityResult(ok, ok ? List.of() : List.of("Schema not compatible"));
        } catch (Exception e) {
            return new CompatibilityResult(false, List.of(e.getMessage()));
        }
    }

    private ParsedSchema parseSchema(String body, String type) {
        Optional<ParsedSchema> parsed = switch (type.toUpperCase()) {
            case "AVRO" -> new AvroSchemaProvider().parseSchema(body, List.of(), false, false);
            case "JSON", "PROTOBUF" -> throw new UnsupportedOperationException(
                    type + " compatibility check is not supported in v0.1 — see FOLLOWUPS.md");
            default -> throw new IllegalArgumentException("Unknown schemaType: " + type);
        };
        return parsed.orElseThrow(() -> new IllegalArgumentException("Could not parse " + type + " schema"));
    }

    private String safeGetCompatibility(String subject) {
        try {
            return client().getCompatibility(subject);
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }
}
