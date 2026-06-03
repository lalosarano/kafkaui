package com.kafkagui.cluster;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.cluster.dto.ClusterInfo;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    private final ClusterRegistry registry;

    public ClusterService(ClusterRegistry registry) {
        this.registry = registry;
    }

    public ClusterInfo current() {
        AdminClient adminClient = registry.adminClient(ClusterContext.require());
        DescribeClusterResult cluster = adminClient.describeCluster();
        Collection<Node> nodes = await(cluster.nodes());
        Node controller = await(cluster.controller());
        String clusterId = await(cluster.clusterId());

        Set<String> topicNames = await(adminClient.listTopics(new ListTopicsOptions().listInternal(true)).names());
        DescribeTopicsResult dtr = adminClient.describeTopics(topicNames);
        Map<String, TopicDescription> descs = await(dtr.allTopicNames());

        int totalPartitions = 0, urp = 0, offline = 0, totalReplicas = 0, inSync = 0;
        for (TopicDescription td : descs.values()) {
            for (TopicPartitionInfo p : td.partitions()) {
                totalPartitions++;
                totalReplicas += p.replicas().size();
                inSync += p.isr().size();
                if (p.leader() == null) offline++;
                if (p.isr().size() < p.replicas().size()) urp++;
            }
        }

        return new ClusterInfo(
                clusterId,
                controller != null ? controller.id() : null,
                nodes.size(),
                describeKafkaVersion(adminClient, nodes),
                topicNames.size(),
                totalPartitions,
                urp,
                offline,
                totalReplicas,
                inSync
        );
    }

    private String describeKafkaVersion(AdminClient adminClient, Collection<Node> nodes) {
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
