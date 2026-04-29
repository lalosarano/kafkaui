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

        List<Topic> all = descs.values().stream()
                .filter(td -> q == null || q.isBlank() || td.name().toLowerCase().contains(q.toLowerCase()))
                .map(td -> new Topic(
                        td.name(),
                        td.partitions().size(),
                        td.partitions().isEmpty() ? 0 : td.partitions().get(0).replicas().size(),
                        td.isInternal()
                ))
                .sorted((a, b) -> a.name().compareTo(b.name()))
                .toList();
        return PageResponse.of(all, page, size);
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
        return new Topic(req.name(), req.partitions(), req.replicationFactor(), false);
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
