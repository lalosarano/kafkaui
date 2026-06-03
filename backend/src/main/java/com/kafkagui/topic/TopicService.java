package com.kafkagui.topic;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.cluster.ClusterRegistry;
import com.kafkagui.common.dto.PageResponse;
import com.kafkagui.topic.dto.CreateTopicRequest;
import com.kafkagui.topic.dto.Partition;
import com.kafkagui.topic.dto.Topic;
import com.kafkagui.topic.dto.TopicConfigEntry;
import com.kafkagui.topic.dto.TopicDetail;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AlterConfigOp;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.ListOffsetsResult;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.admin.OffsetSpec;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.Node;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.config.ConfigResource;
import org.springframework.stereotype.Service;

@Service
public class TopicService {

    private final ClusterRegistry registry;

    public TopicService(ClusterRegistry registry) {
        this.registry = registry;
    }

    private AdminClient client() {
        return registry.adminClient(ClusterContext.require());
    }

    public PageResponse<Topic> list(String q, boolean showInternal, int page, int size) {
        AdminClient adminClient = client();
        Set<String> names = await(adminClient.listTopics(new ListTopicsOptions().listInternal(showInternal)).names());
        Map<String, TopicDescription> descs = await(adminClient.describeTopics(names).allTopicNames());

        // One pass to collect every partition and every broker that hosts a replica.
        List<TopicPartition> allTps = new ArrayList<>();
        Set<Integer> brokerIds = new HashSet<>();
        for (TopicDescription td : descs.values()) {
            for (var p : td.partitions()) {
                allTps.add(new TopicPartition(td.name(), p.partition()));
                for (Node r : p.replicas()) brokerIds.add(r.id());
            }
        }

        // Message counts (latest - earliest) and leader-replica disk sizes, all batched.
        Map<TopicPartition, Long> earliest = offsets(adminClient, allTps, OffsetSpec.earliest());
        Map<TopicPartition, Long> latest = offsets(adminClient, allTps, OffsetSpec.latest());
        Map<Integer, Map<TopicPartition, Long>> dirSizes = describeDirSizes(adminClient, brokerIds);
        boolean haveSize = !dirSizes.isEmpty();

        List<Topic> all = descs.values().stream()
                .filter(td -> q == null || q.isBlank() || td.name().toLowerCase().contains(q.toLowerCase()))
                .map(td -> {
                    long messages = 0;
                    long bytes = 0;
                    int outOfSync = 0;
                    for (var p : td.partitions()) {
                        TopicPartition tp = new TopicPartition(td.name(), p.partition());
                        long lo = earliest.getOrDefault(tp, 0L);
                        long hi = latest.getOrDefault(tp, lo);
                        messages += Math.max(0, hi - lo);
                        outOfSync += Math.max(0, p.replicas().size() - p.isr().size());
                        if (haveSize && p.leader() != null) {
                            Map<TopicPartition, Long> brokerMap = dirSizes.get(p.leader().id());
                            if (brokerMap != null) bytes += brokerMap.getOrDefault(tp, 0L);
                        }
                    }
                    return new Topic(
                            td.name(),
                            td.partitions().size(),
                            td.partitions().isEmpty() ? 0 : td.partitions().get(0).replicas().size(),
                            td.isInternal(),
                            messages,
                            haveSize ? bytes : -1L,
                            outOfSync
                    );
                })
                .sorted((a, b) -> a.name().compareTo(b.name()))
                .toList();
        return PageResponse.of(all, page, size);
    }

    private Map<TopicPartition, Long> offsets(AdminClient admin, List<TopicPartition> tps, OffsetSpec spec) {
        if (tps.isEmpty()) return Map.of();
        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> res =
                await(admin.listOffsets(tps.stream().collect(Collectors.toMap(t -> t, t -> spec))).all());
        Map<TopicPartition, Long> out = new HashMap<>();
        for (var e : res.entrySet()) out.put(e.getKey(), e.getValue().offset());
        return out;
    }

    /** brokerId -> (TopicPartition -> bytes), or empty if describeLogDirs is unavailable. */
    private Map<Integer, Map<TopicPartition, Long>> describeDirSizes(AdminClient admin, Set<Integer> brokerIds) {
        Map<Integer, Map<TopicPartition, Long>> out = new HashMap<>();
        if (brokerIds.isEmpty()) return out;
        try {
            var dirs = await(admin.describeLogDirs(brokerIds).allDescriptions());
            for (var e : dirs.entrySet()) {
                Map<TopicPartition, Long> perTp = new HashMap<>();
                for (var d : e.getValue().values()) {
                    for (var ri : d.replicaInfos().entrySet()) {
                        perTp.merge(ri.getKey(), ri.getValue().size(), Long::sum);
                    }
                }
                out.put(e.getKey(), perTp);
            }
        } catch (Exception ignored) {
            // describeLogDirs not supported — sizes will be reported as unavailable (-1).
        }
        return out;
    }

    public TopicDetail get(String name) {
        AdminClient adminClient = client();
        TopicDescription td = await(adminClient.describeTopics(List.of(name)).allTopicNames()).get(name);

        List<TopicPartition> tps = td.partitions().stream()
                .map(p -> new TopicPartition(name, p.partition()))
                .toList();
        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> earliest =
                await(adminClient.listOffsets(tps.stream().collect(Collectors.toMap(t -> t, t -> OffsetSpec.earliest()))).all());
        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> latest =
                await(adminClient.listOffsets(tps.stream().collect(Collectors.toMap(t -> t, t -> OffsetSpec.latest()))).all());

        List<Partition> partitions = td.partitions().stream()
                .map(p -> {
                    TopicPartition tp = new TopicPartition(name, p.partition());
                    return new Partition(
                            p.partition(),
                            p.leader() != null ? p.leader().id() : null,
                            p.replicas().stream().map(Node::id).toList(),
                            p.isr().stream().map(Node::id).toList(),
                            earliest.get(tp).offset(),
                            latest.get(tp).offset()
                    );
                })
                .sorted((a, b) -> Integer.compare(a.partition(), b.partition()))
                .toList();

        int rf = td.partitions().isEmpty() ? 0 : td.partitions().get(0).replicas().size();
        return new TopicDetail(name, td.isInternal(), rf, partitions, configs(name));
    }

    public List<TopicConfigEntry> configs(String name) {
        AdminClient adminClient = client();
        ConfigResource resource = new ConfigResource(ConfigResource.Type.TOPIC, name);
        Config config = await(adminClient.describeConfigs(List.of(resource)).all()).get(resource);
        return config.entries().stream()
                .map(e -> new TopicConfigEntry(e.name(), e.value(), e.source().name(), e.isReadOnly(), e.isSensitive()))
                .sorted((a, b) -> a.name().compareTo(b.name()))
                .toList();
    }

    public Topic create(CreateTopicRequest req) {
        NewTopic nt = new NewTopic(req.name(), req.partitions(), (short) req.replicationFactor());
        if (req.configs() != null && !req.configs().isEmpty()) {
            nt.configs(req.configs());
        }
        await(client().createTopics(List.of(nt)).all());
        return new Topic(req.name(), req.partitions(), req.replicationFactor(), false, 0L, 0L, 0);
    }

    public void delete(String name) {
        await(client().deleteTopics(List.of(name)).all());
    }

    public List<TopicConfigEntry> updateConfigs(String name, Map<String, String> updates) {
        ConfigResource resource = new ConfigResource(ConfigResource.Type.TOPIC, name);
        List<AlterConfigOp> ops = new ArrayList<>();
        for (var e : updates.entrySet()) {
            ops.add(new AlterConfigOp(new ConfigEntry(e.getKey(), e.getValue()), AlterConfigOp.OpType.SET));
        }
        Map<ConfigResource, Collection<AlterConfigOp>> arg = new HashMap<>();
        arg.put(resource, ops);
        await(client().incrementalAlterConfigs(arg).all());
        return configs(name);
    }
}
