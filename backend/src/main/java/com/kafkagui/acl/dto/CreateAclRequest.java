package com.kafkagui.acl.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAclRequest(
        @NotBlank String principal,
        String host,
        @NotBlank String resourceType,
        @NotBlank String resourceName,
        @NotBlank String patternType,
        @NotBlank String operation,
        @NotBlank String permissionType
) {}
