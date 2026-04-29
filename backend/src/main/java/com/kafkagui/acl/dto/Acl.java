package com.kafkagui.acl.dto;

public record Acl(
        String principal,
        String host,
        String resourceType,    // TOPIC | GROUP | CLUSTER | TRANSACTIONAL_ID | DELEGATION_TOKEN
        String resourceName,
        String patternType,     // LITERAL | PREFIXED
        String operation,       // READ | WRITE | DESCRIBE | ...
        String permissionType   // ALLOW | DENY
) {}
