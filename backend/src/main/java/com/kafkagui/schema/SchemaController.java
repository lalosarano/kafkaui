package com.kafkagui.schema;

import com.kafkagui.schema.dto.CompatibilityRequest;
import com.kafkagui.schema.dto.CompatibilityResult;
import com.kafkagui.schema.dto.SchemaVersion;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/schemas")
public class SchemaController {

    private final SchemaService service;

    public SchemaController(SchemaService service) {
        this.service = service;
    }

    @GetMapping("/subjects")
    public List<String> subjects() {
        return service.subjects();
    }

    @GetMapping("/subjects/{subject}/versions")
    public List<Integer> versions(@PathVariable String subject) {
        return service.versions(subject);
    }

    @GetMapping("/subjects/{subject}/versions/latest")
    public SchemaVersion latest(@PathVariable String subject) {
        return service.latest(subject);
    }

    @GetMapping("/subjects/{subject}/versions/{version}")
    public SchemaVersion version(@PathVariable String subject, @PathVariable int version) {
        return service.get(subject, version);
    }

    @PostMapping("/subjects/{subject}/compatibility")
    public CompatibilityResult check(@PathVariable String subject, @Valid @RequestBody CompatibilityRequest req) {
        return service.checkCompatibility(subject, req);
    }
}
