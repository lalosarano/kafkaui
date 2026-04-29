package com.kafkagui.acl;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.acl.dto.Acl;
import com.kafkagui.acl.dto.CreateAclRequest;
import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.cluster.ClusterRegistry;
import java.util.Collection;
import java.util.List;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.common.acl.AccessControlEntry;
import org.apache.kafka.common.acl.AccessControlEntryFilter;
import org.apache.kafka.common.acl.AclBinding;
import org.apache.kafka.common.acl.AclBindingFilter;
import org.apache.kafka.common.acl.AclOperation;
import org.apache.kafka.common.acl.AclPermissionType;
import org.apache.kafka.common.resource.PatternType;
import org.apache.kafka.common.resource.ResourcePattern;
import org.apache.kafka.common.resource.ResourcePatternFilter;
import org.apache.kafka.common.resource.ResourceType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AclService {

    private final ClusterRegistry registry;

    public AclService(ClusterRegistry registry) {
        this.registry = registry;
    }

    private AdminClient client() {
        return registry.adminClient(ClusterContext.require());
    }

    public List<Acl> list(String principal, String resourceType, String resourceName) {
        ResourcePatternFilter rpf = new ResourcePatternFilter(
                StringUtils.hasText(resourceType) ? ResourceType.fromString(resourceType) : ResourceType.ANY,
                StringUtils.hasText(resourceName) ? resourceName : null,
                PatternType.ANY
        );
        AccessControlEntryFilter aef = new AccessControlEntryFilter(
                StringUtils.hasText(principal) ? principal : null,
                null,
                AclOperation.ANY,
                AclPermissionType.ANY
        );
        Collection<AclBinding> bindings = await(client().describeAcls(new AclBindingFilter(rpf, aef)).values());
        return bindings.stream().map(this::toDto).toList();
    }

    public Acl create(CreateAclRequest req) {
        AclBinding binding = toBinding(req);
        await(client().createAcls(List.of(binding)).all());
        return toDto(binding);
    }

    public int delete(String principal, String resourceType, String resourceName, String operation) {
        ResourcePatternFilter rpf = new ResourcePatternFilter(
                StringUtils.hasText(resourceType) ? ResourceType.fromString(resourceType) : ResourceType.ANY,
                StringUtils.hasText(resourceName) ? resourceName : null,
                PatternType.ANY
        );
        AccessControlEntryFilter aef = new AccessControlEntryFilter(
                StringUtils.hasText(principal) ? principal : null,
                null,
                StringUtils.hasText(operation) ? AclOperation.fromString(operation) : AclOperation.ANY,
                AclPermissionType.ANY
        );
        return await(client().deleteAcls(List.of(new AclBindingFilter(rpf, aef))).all()).size();
    }

    private AclBinding toBinding(CreateAclRequest r) {
        ResourcePattern rp = new ResourcePattern(
                ResourceType.fromString(r.resourceType()),
                r.resourceName(),
                PatternType.fromString(r.patternType())
        );
        AccessControlEntry ace = new AccessControlEntry(
                r.principal(),
                r.host() != null && !r.host().isBlank() ? r.host() : "*",
                AclOperation.fromString(r.operation()),
                AclPermissionType.fromString(r.permissionType())
        );
        return new AclBinding(rp, ace);
    }

    private Acl toDto(AclBinding b) {
        return new Acl(
                b.entry().principal(),
                b.entry().host(),
                b.pattern().resourceType().toString(),
                b.pattern().name(),
                b.pattern().patternType().toString(),
                b.entry().operation().toString(),
                b.entry().permissionType().toString()
        );
    }
}
