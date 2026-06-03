package com.kafkagui.broker;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.broker.dto.Broker;
import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.cluster.ClusterRegistry;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.admin.LogDirDescription;
import org.apache.kafka.clients.admin.ReplicaInfo;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.Node;
import org.apache.kafka.common.TopicPartitionInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class BrokerService {

    private static final Logger log = LoggerFactory.getLogger(BrokerService.class);

    private final ClusterRegistry registry;

    public BrokerService(ClusterRegistry registry) {
        this.registry = registry;
    }

    public List<Broker> list() {
        AdminClient adminClient = registry.adminClient(ClusterContext.require());
        DescribeClusterResult res = adminClient.describeCluster();
        Collection<Node> nodes = await(res.nodes());
        Node controller = await(res.controller());
        Integer controllerId = controller != null ? controller.id() : null;

        // Aggregate per-broker leader / replica / online counts across every partition.
        Map<Integer, Integer> replicaCount = new HashMap<>();
        Map<Integer, Integer> leaderCount = new HashMap<>();
        Map<Integer, Integer> onlineCount = new HashMap<>();
        int totalPartitions = 0;
        Set<String> topicNames = await(adminClient.listTopics(new ListTopicsOptions().listInternal(true)).names());
        Map<String, TopicDescription> descs = await(adminClient.describeTopics(topicNames).allTopicNames());
        for (TopicDescription td : descs.values()) {
            for (TopicPartitionInfo p : td.partitions()) {
                totalPartitions++;
                boolean online = p.leader() != null;
                if (online) leaderCount.merge(p.leader().id(), 1, Integer::sum);
                for (Node r : p.replicas()) {
                    replicaCount.merge(r.id(), 1, Integer::sum);
                    if (online) onlineCount.merge(r.id(), 1, Integer::sum);
                }
            }
        }
        int brokerN = Math.max(1, nodes.size());
        double avgReplicas = replicaCount.values().stream().mapToInt(Integer::intValue).sum() / (double) brokerN;
        double avgLeaders = totalPartitions / (double) brokerN;

        // Disk usage is best-effort: some brokers / protocols don't support describeLogDirs.
        Map<Integer, long[]> disk = describeDisk(adminClient, nodes);

        return nodes.stream()
                .map(n -> {
                    int rc = replicaCount.getOrDefault(n.id(), 0);
                    int lc = leaderCount.getOrDefault(n.id(), 0);
                    int oc = onlineCount.getOrDefault(n.id(), 0);
                    long[] d = disk.get(n.id());
                    return new Broker(
                            n.id(), n.host(), n.port(), n.rack(),
                            controllerId != null && n.id() == controllerId,
                            rc, lc, oc,
                            skew(rc, avgReplicas),
                            skew(lc, avgLeaders),
                            d != null ? d[0] : -1L,
                            d != null ? (int) d[1] : 0);
                })
                .sorted((a, b) -> Integer.compare(a.id(), b.id()))
                .toList();
    }

    /** @return brokerId -> [totalBytes, replicaEntries], or empty if describeLogDirs is unavailable. */
    private Map<Integer, long[]> describeDisk(AdminClient adminClient, Collection<Node> nodes) {
        Map<Integer, long[]> out = new HashMap<>();
        try {
            List<Integer> ids = nodes.stream().map(Node::id).toList();
            Map<Integer, Map<String, LogDirDescription>> dirs =
                    await(adminClient.describeLogDirs(ids).allDescriptions());
            for (var e : dirs.entrySet()) {
                long bytes = 0;
                int entries = 0;
                for (LogDirDescription d : e.getValue().values()) {
                    for (ReplicaInfo ri : d.replicaInfos().values()) {
                        bytes += ri.size();
                        entries++;
                    }
                }
                out.put(e.getKey(), new long[] {bytes, entries});
            }
        } catch (Exception e) {
            log.debug("describeLogDirs unavailable: {}", e.getMessage());
        }
        return out;
    }

    private static double skew(int value, double avg) {
        if (avg <= 0) return 0.0;
        return Math.round((value - avg) / avg * 10_000.0) / 100.0; // percent, 2 decimals
    }
}
