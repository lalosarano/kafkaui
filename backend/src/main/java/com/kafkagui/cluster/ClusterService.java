package com.kafkagui.cluster;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.cluster.dto.ClusterInfo;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.apache.kafka.clients.admin.DescribeConfigsResult;
import org.apache.kafka.clients.admin.DescribeTopicsResult;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.Node;
import org.apache.kafka.common.TopicPartitionInfo;
import org.apache.kafka.common.config.ConfigResource;
import org.springframework.stereotype.Service;

@Service
public class ClusterService {

    private final AdminClient adminClient;

    public ClusterService(AdminClient adminClient) {
        this.adminClient = adminClient;
    }

    public ClusterInfo current() {
        DescribeClusterResult cluster = adminClient.describeCluster();
        Collection<Node> nodes = await(cluster.nodes());
        Node controller = await(cluster.controller());
        String clusterId = await(cluster.clusterId());

        Set<String> topicNames = await(adminClient.listTopics(new ListTopicsOptions().listInternal(true)).names());
        DescribeTopicsResult dtr = adminClient.describeTopics(topicNames);
        Map<String, TopicDescription> descs = await(dtr.allTopicNames());

        int totalPartitions = 0, urp = 0, offline = 0;
        for (TopicDescription td : descs.values()) {
            for (TopicPartitionInfo p : td.partitions()) {
                totalPartitions++;
                if (p.leader() == null) offline++;
                if (p.isr().size() < p.replicas().size()) urp++;
            }
        }

        String version = describeKafkaVersion(nodes);

        return new ClusterInfo(
                clusterId,
                controller != null ? controller.id() : null,
                nodes.size(),
                version,
                topicNames.size(),
                totalPartitions,
                urp,
                offline
        );
    }

    private String describeKafkaVersion(Collection<Node> nodes) {
        if (nodes.isEmpty()) return "unknown";
        try {
            ConfigResource resource = new ConfigResource(ConfigResource.Type.BROKER, String.valueOf(nodes.iterator().next().id()));
            DescribeConfigsResult res = adminClient.describeConfigs(List.of(resource));
            Config config = await(res.all()).get(resource);
            ConfigEntry e = config.get("inter.broker.protocol.version");
            return e != null ? e.value() : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
