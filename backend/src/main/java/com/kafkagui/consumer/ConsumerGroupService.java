package com.kafkagui.consumer;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.cluster.ClusterRegistry;
import com.kafkagui.consumer.dto.ConsumerGroupDetail;
import com.kafkagui.consumer.dto.ConsumerGroupMember;
import com.kafkagui.consumer.dto.ConsumerGroupSummary;
import com.kafkagui.consumer.dto.PartitionAssignment;
import com.kafkagui.consumer.dto.ResetOffsetsRequest;
import com.kafkagui.consumer.dto.ResetOffsetsResult;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ConsumerGroupDescription;
import org.apache.kafka.clients.admin.ConsumerGroupListing;
import org.apache.kafka.clients.admin.ListOffsetsResult;
import org.apache.kafka.clients.admin.MemberDescription;
import org.apache.kafka.clients.admin.OffsetSpec;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.ConsumerGroupState;
import org.apache.kafka.common.TopicPartition;
import org.springframework.stereotype.Service;

@Service
public class ConsumerGroupService {

    private final ClusterRegistry registry;

    public ConsumerGroupService(ClusterRegistry registry) {
        this.registry = registry;
    }

    private AdminClient client() {
        return registry.adminClient(ClusterContext.require());
    }

    public List<ConsumerGroupSummary> list(String stateFilter, String q) {
        AdminClient adminClient = client();
        Collection<ConsumerGroupListing> all = await(adminClient.listConsumerGroups().all());
        List<String> ids = all.stream()
                .map(ConsumerGroupListing::groupId)
                .filter(id -> q == null || q.isBlank() || id.toLowerCase().contains(q.toLowerCase()))
                .toList();
        if (ids.isEmpty()) return List.of();

        Map<String, ConsumerGroupDescription> descs = await(adminClient.describeConsumerGroups(ids).all());

        List<ConsumerGroupSummary> out = new ArrayList<>(ids.size());
        for (String id : ids) {
            ConsumerGroupDescription d = descs.get(id);
            if (d == null) continue;
            String state = d.state().toString().toLowerCase();
            if (stateFilter != null && !"all".equalsIgnoreCase(stateFilter) && !state.equalsIgnoreCase(stateFilter)) {
                continue;
            }
            long lag = computeTotalLag(adminClient, id);
            out.add(new ConsumerGroupSummary(
                    id,
                    state,
                    d.members().size(),
                    lag,
                    d.partitionAssignor(),
                    d.coordinator() != null ? d.coordinator().id() : null
            ));
        }
        return out;
    }

    public ConsumerGroupDetail get(String groupId) {
        AdminClient adminClient = client();
        ConsumerGroupDescription d = await(adminClient.describeConsumerGroups(List.of(groupId)).all()).get(groupId);
        // Kafka returns a DEAD-state description (not null) for a group that has never existed,
        // so treat that as "not found" too — maps to 404 group-not-found in the API.
        if (d == null || d.state() == ConsumerGroupState.DEAD) {
            throw new org.apache.kafka.common.errors.GroupIdNotFoundException(groupId);
        }
        Map<TopicPartition, OffsetAndMetadata> committed = await(adminClient.listConsumerGroupOffsets(groupId)
                .partitionsToOffsetAndMetadata());

        Set<TopicPartition> tps = committed.keySet();
        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> ends = tps.isEmpty() ? Map.of()
                : await(adminClient.listOffsets(tps.stream().collect(Collectors.toMap(t -> t, t -> OffsetSpec.latest()))).all());

        Map<TopicPartition, MemberDescription> partitionToMember = new HashMap<>();
        for (MemberDescription m : d.members()) {
            for (TopicPartition tp : m.assignment().topicPartitions()) partitionToMember.put(tp, m);
        }

        List<PartitionAssignment> assignments = new ArrayList<>();
        long totalLag = 0;
        for (var e : committed.entrySet()) {
            TopicPartition tp = e.getKey();
            long current = e.getValue().offset();
            long end = ends.getOrDefault(tp, new ListOffsetsResult.ListOffsetsResultInfo(current, -1, java.util.Optional.empty())).offset();
            long lag = Math.max(0, end - current);
            totalLag += lag;
            MemberDescription m = partitionToMember.get(tp);
            assignments.add(new PartitionAssignment(
                    tp.topic(), tp.partition(), current, end, lag,
                    m != null ? m.consumerId() : null,
                    m != null ? m.host() : null
            ));
        }

        List<ConsumerGroupMember> members = d.members().stream()
                .map(m -> new ConsumerGroupMember(
                        m.consumerId(),
                        m.clientId(),
                        m.host(),
                        m.assignment().topicPartitions().stream()
                                .map(tp -> tp.topic() + "-" + tp.partition()).toList()
                ))
                .toList();

        return new ConsumerGroupDetail(
                groupId,
                d.state().toString().toLowerCase(),
                d.partitionAssignor(),
                d.coordinator() != null ? d.coordinator().id() : null,
                totalLag,
                members,
                assignments
        );
    }

    private long computeTotalLag(AdminClient adminClient, String groupId) {
        try {
            Map<TopicPartition, OffsetAndMetadata> committed = await(adminClient.listConsumerGroupOffsets(groupId)
                    .partitionsToOffsetAndMetadata());
            if (committed.isEmpty()) return 0L;
            Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> ends = await(
                    adminClient.listOffsets(committed.keySet().stream()
                            .collect(Collectors.toMap(t -> t, t -> OffsetSpec.latest()))).all());
            long total = 0;
            for (var e : committed.entrySet()) {
                long end = ends.containsKey(e.getKey()) ? ends.get(e.getKey()).offset() : e.getValue().offset();
                total += Math.max(0, end - e.getValue().offset());
            }
            return total;
        } catch (Exception ex) {
            return 0L;
        }
    }

    public ResetOffsetsResult resetOffsets(String groupId, ResetOffsetsRequest req) {
        if ("timestamp".equals(req.strategy())) {
            throw new UnsupportedOperationException("Reset by timestamp is not implemented in v0.1");
        }
        AdminClient adminClient = client();
        Map<TopicPartition, OffsetAndMetadata> committed = await(adminClient.listConsumerGroupOffsets(groupId)
                .partitionsToOffsetAndMetadata());
        List<TopicPartition> tps = committed.keySet().stream()
                .filter(tp -> tp.topic().equals(req.topic()))
                .filter(tp -> req.partitions() == null || req.partitions().isEmpty() || req.partitions().contains(tp.partition()))
                .toList();
        if (tps.isEmpty()) {
            throw new IllegalArgumentException("No committed partitions found for group/topic combination");
        }

        Map<TopicPartition, OffsetSpec> spec;
        if ("earliest".equals(req.strategy())) {
            spec = tps.stream().collect(Collectors.toMap(t -> t, t -> OffsetSpec.earliest()));
        } else if ("latest".equals(req.strategy())) {
            spec = tps.stream().collect(Collectors.toMap(t -> t, t -> OffsetSpec.latest()));
        } else if ("offset".equals(req.strategy())) {
            if (req.value() == null) throw new IllegalArgumentException("value required for strategy=offset");
            Map<TopicPartition, OffsetAndMetadata> target = tps.stream()
                    .collect(Collectors.toMap(t -> t, t -> new OffsetAndMetadata(req.value())));
            await(adminClient.alterConsumerGroupOffsets(groupId, target).all());
            return new ResetOffsetsResult(groupId, req.topic(),
                    target.entrySet().stream().collect(Collectors.toMap(e -> e.getKey().partition(), e -> e.getValue().offset())));
        } else {
            throw new IllegalArgumentException("Unknown strategy: " + req.strategy());
        }

        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> resolved = await(adminClient.listOffsets(spec).all());
        Map<TopicPartition, OffsetAndMetadata> target = resolved.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> new OffsetAndMetadata(e.getValue().offset())));
        await(adminClient.alterConsumerGroupOffsets(groupId, target).all());
        return new ResetOffsetsResult(groupId, req.topic(),
                target.entrySet().stream().collect(Collectors.toMap(e -> e.getKey().partition(), e -> e.getValue().offset())));
    }

    public void delete(String groupId) {
        await(client().deleteConsumerGroups(List.of(groupId)).all());
    }
}
