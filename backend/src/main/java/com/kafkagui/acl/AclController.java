package com.kafkagui.acl;

import com.kafkagui.acl.dto.Acl;
import com.kafkagui.acl.dto.CreateAclRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/acls")
public class AclController {

    private final AclService service;

    public AclController(AclService service) {
        this.service = service;
    }

    @GetMapping
    public List<Acl> list(
            @RequestParam(required = false) String principal,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceName) {
        return service.list(principal, resourceType, resourceName);
    }

    @PostMapping
    public Acl create(@Valid @RequestBody CreateAclRequest req) {
        return service.create(req);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Integer>> delete(
            @RequestParam(required = false) String principal,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) String resourceName,
            @RequestParam(required = false) String operation) {
        int deleted = service.delete(principal, resourceType, resourceName, operation);
        return ResponseEntity.ok(Map.of("deleted", deleted));
    }
}
