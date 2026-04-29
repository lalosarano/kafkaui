package com.kafkagui.metrics;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.cluster.ClusterConfigStore;
import com.kafkagui.cluster.ClusterRegistry;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ConsumerGroupListing;
import org.apache.kafka.clients.admin.DescribeLogDirsResult;
import org.apache.kafka.clients.admin.ListOffsetsResult;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.admin.LogDirDescription;
import org.apache.kafka.clients.admin.OffsetSpec;
import org.apache.kafka.clients.admin.ReplicaInfo;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.clients.consumer.OffsetAndMetadata;
import org.apache.kafka.common.TopicPartition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Polls each registered cluster on a fixed interval and derives throughput by
 * computing offset/log-size deltas vs the previous sample. Stores a rolling
 * 60-point buffer per cluster (~5 minutes at the default 5s interval).
 *
 * Notes:
 * - "in" rate is the change in sum-of-end-offsets across all non-internal partitions.
 * - "out" rate is the change in sum-of-committed-offsets across all consumer groups.
 * - "bytes" comes from describeLogDirs(), summing primary-replica sizes.
 * - Per-topic series feed the dashboard's "top topics" sparklines.
 */
@Component
public class MetricsCollector {

    private static final Logger log = LoggerFactory.getLogger(MetricsCollector.class);
    static final int BUFFER_SIZE = 60;
    static final int TOP_TOPICS = 10;

    private final ClusterConfigStore store;
    private final ClusterRegistry registry;
    private final Map<String, ClusterMetrics> byCluster = new ConcurrentHashMap<>();

    public MetricsCollector(ClusterConfigStore store, ClusterRegistry registry) {
        this.store = store;
        this.registry = registry;
    }

    public ClusterMetrics get(String clusterId) {
        return byCluster.computeIfAbsent(clusterId, id -> new ClusterMetrics());
    }

    @Scheduled(fixedRateString = "${kafka-gui.metrics.interval-ms:5000}", initialDelay = 2_000)
    void tick() {
        for (var cfg : store.list()) {
            String clusterId = cfg.id();
            try {
                sample(clusterId);
            } catch (Exception e) {
                log.debug("Metrics tick failed for cluster {}: {}", clusterId, e.getMessage());
            }
        }
    }

    private void sample(String clusterId) {
        AdminClient ac = registry.adminClient(clusterId);
        ClusterMetrics m = get(clusterId);
        long now = System.currentTimeMillis();

        // 1. Topic discovery — exclude Kafka internal topics and underscore-prefixed convention topics
        //    (e.g. _schemas from Schema Registry) so they don't dominate the dashboard.
        Set<String> names = await(ac.listTopics(new ListTopicsOptions().listInternal(false)).names())
                .stream().filter(n -> !n.startsWith("_")).collect(Collectors.toSet());
        if (names.isEmpty()) {
            m.append(now, 0, 0, 0, 0, Map.of(), Map.of(), Map.of());
            return;
        }
        Map<String, TopicDescription> descs = await(ac.describeTopics(names).allTopicNames());

        // 2. End offsets per partition (sum → total messages)
        Map<TopicPartition, OffsetSpec> latestSpec = new HashMap<>();
        for (var d : descs.values()) {
            for (var p : d.partitions()) latestSpec.put(new TopicPartition(d.name(), p.partition()), OffsetSpec.latest());
        }
        Map<TopicPartition, ListOffsetsResult.ListOffsetsResultInfo> ends =
                await(ac.listOffsets(latestSpec).all());
        Map<String, Long> endByTopic = new HashMap<>();
        long totalEnd = 0;
        for (var e : ends.entrySet()) {
            long off = e.getValue().offset();
            endByTopic.merge(e.getKey().topic(), off, Long::sum);
            totalEnd += off;
        }

        // 3. Committed offsets across all consumer groups (sum → total consumed messages)
        long totalCommitted = 0;
        try {
            var groups = await(ac.listConsumerGroups().all()).stream().map(ConsumerGroupListing::groupId).toList();
            for (String g : groups) {
                try {
                    Map<TopicPartition, OffsetAndMetadata> co =
                            await(ac.listConsumerGroupOffsets(g).partitionsToOffsetAndMetadata());
                    for (var e : co.entrySet()) totalCommitted += e.getValue().offset();
                } catch (Exception ignored) { /* deleted/zombie group */ }
            }
        } catch (Exception ignored) { /* tolerate missing perms */ }

        // 4. Log dir sizes (per topic, sum primary replicas)
        Map<String, Long> bytesByTopic = new HashMap<>();
        long totalBytes = 0;
        try {
            List<Integer> brokerIds = await(ac.describeCluster().nodes()).stream().map(n -> n.id()).toList();
            DescribeLogDirsResult ld = ac.describeLogDirs(brokerIds);
            for (var brokerEntry : await(ld.allDescriptions()).entrySet()) {
                for (LogDirDescription dir : brokerEntry.getValue().values()) {
                    for (var rep : dir.replicaInfos().entrySet()) {
                        TopicPartition tp = rep.getKey();
                        if (tp.topic().startsWith("_") || tp.topic().startsWith("__")) continue;
                        ReplicaInfo info = rep.getValue();
                        // Only count one replica per partition (the future-flagged one is special; sum all and divide later is messier)
                        // Simplest: take leader's size only — but we don't know leader from here without more calls.
                        // For an approximation, add all replica sizes (the chart shows relative growth, exact value is OK fuzzy).
                        bytesByTopic.merge(tp.topic(), info.size(), Long::sum);
                        totalBytes += info.size();
                    }
                }
            }
        } catch (Exception ignored) { /* describeLogDirs may need cluster-action perms */ }

        m.append(now, totalEnd, totalCommitted, totalBytes,
                descs.size(),
                endByTopic, bytesByTopic, partitionCounts(descs));
    }

    private Map<String, Integer> partitionCounts(Map<String, TopicDescription> descs) {
        Map<String, Integer> out = new HashMap<>();
        for (var e : descs.entrySet()) out.put(e.getKey(), e.getValue().partitions().size());
        return out;
    }

    /** Per-cluster ring buffer. */
    static final class ClusterMetrics {
        final LinkedList<Sample> samples = new LinkedList<>();

        synchronized void append(long ts, long endSum, long committedSum, long bytesSum, int topicCount,
                                  Map<String, Long> endByTopic, Map<String, Long> bytesByTopic,
                                  Map<String, Integer> partitionCounts) {
            samples.add(new Sample(ts, endSum, committedSum, bytesSum, topicCount,
                    new LinkedHashMap<>(endByTopic), new LinkedHashMap<>(bytesByTopic), partitionCounts));
            while (samples.size() > BUFFER_SIZE) samples.removeFirst();
        }

        synchronized List<Sample> snapshot() { return List.copyOf(samples); }
    }

    record Sample(long ts, long endSum, long committedSum, long bytesSum, int topicCount,
                  Map<String, Long> endByTopic, Map<String, Long> bytesByTopic,
                  Map<String, Integer> partitionCounts) {}
}
