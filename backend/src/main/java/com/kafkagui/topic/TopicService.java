package com.kafkagui.topic;

import static com.kafkagui.common.KafkaFutures.get;

import com.kafkagui.common.dto.PageResponse;
import com.kafkagui.topic.dto.CreateTopicRequest;
import com.kafkagui.topic.dto.Partition;
import com.kafkagui.topic.dto.Topic;
import com.kafkagui.topic.dto.TopicConfigEntry;
import com.kafkagui.topic.dto.TopicDetail;
import java.util.ArrayList;
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
import org.apache.kafka.common.TopicPartitionInfo;
import org.apache.kafka.common.config.ConfigResource;
import org.springframework.stereotype.Service;

@Service
public class TopicService {

    private final AdminClient adminClient;

    public TopicService(AdminClient adminClient) {
        this.adminClient = adminClient;
    }

    public PageResponse<Topic> list(String q, boolean showInternal, int page, int size) {
        Set<String> names = get(adminClient.listTopics(new ListTopicsOptions().listInternal(showInternal)).names());
        Map<String, TopicDescription> descs = get(adminClient.describeTopics(names).allTopicNames());

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
        TopicDescription td = get(adminClient.describeTopics(List.of(name)).allTopicNames()).get(name);

        List<TopicPartition> tps = td.partitions().stream()
                .map(p -> new TopicPartition(name, p.partition()))
                .toList();
        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> earliest =
                get(adminClient.listOffsets(tps.stream().collect(Collectors.toMap(t -> t, t -> OffsetSpec.earliest()))).all());
        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> latest =
                get(adminClient.listOffsets(tps.stream().collect(Collectors.toMap(t -> t, t -> OffsetSpec.latest()))).all());

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
        ConfigResource resource = new ConfigResource(ConfigResource.Type.TOPIC, name);
        Config config = get(adminClient.describeConfigs(List.of(resource)).all()).get(resource);
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
        get(adminClient.createTopics(List.of(nt)).all());
        return new Topic(req.name(), req.partitions(), req.replicationFactor(), false);
    }

    public void delete(String name) {
        get(adminClient.deleteTopics(List.of(name)).all());
    }

    public List<TopicConfigEntry> updateConfigs(String name, Map<String, String> updates) {
        ConfigResource resource = new ConfigResource(ConfigResource.Type.TOPIC, name);
        List<AlterConfigOp> ops = new ArrayList<>();
        for (var e : updates.entrySet()) {
            ops.add(new AlterConfigOp(new ConfigEntry(e.getKey(), e.getValue()), AlterConfigOp.OpType.SET));
        }
        Map<ConfigResource, java.util.Collection<AlterConfigOp>> arg = new HashMap<>();
        arg.put(resource, ops);
        get(adminClient.incrementalAlterConfigs(arg).all());
        return configs(name);
    }
}
