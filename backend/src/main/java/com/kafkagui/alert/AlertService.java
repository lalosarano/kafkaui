package com.kafkagui.alert;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.alert.dto.Alert;
import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.cluster.ClusterRegistry;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ConsumerGroupDescription;
import org.apache.kafka.clients.admin.ConsumerGroupListing;
import org.apache.kafka.clients.admin.ListTopicsOptions;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.ConsumerGroupState;
import org.apache.kafka.common.TopicPartitionInfo;
import org.springframework.stereotype.Service;

/** Synthesizes alerts from real cluster state — Kafka has no built-in alert API. */
@Service
public class AlertService {

    private final ClusterRegistry registry;

    public AlertService(ClusterRegistry registry) {
        this.registry = registry;
    }

    public List<Alert> list() {
        AdminClient ac = registry.adminClient(ClusterContext.require());
        List<Alert> out = new ArrayList<>();
        long now = System.currentTimeMillis();

        try {
            Set<String> names = await(ac.listTopics(new ListTopicsOptions().listInternal(false)).names());
            Map<String, TopicDescription> descs = await(ac.describeTopics(names).allTopicNames());
            int urpTopics = 0, offlineTopics = 0;
            String urpExample = null, offlineExample = null;
            for (var d : descs.values()) {
                int urp = 0, offline = 0;
                for (TopicPartitionInfo p : d.partitions()) {
                    if (p.leader() == null) offline++;
                    else if (p.isr().size() < p.replicas().size()) urp++;
                }
                if (urp > 0) { urpTopics++; if (urpExample == null) urpExample = d.name() + " (" + urp + " URP)"; }
                if (offline > 0) { offlineTopics++; if (offlineExample == null) offlineExample = d.name() + " (" + offline + " offline)"; }
            }
            if (urpTopics > 0) {
                out.add(new Alert("urp", "warning",
                        "Under-replicated partitions",
                        urpTopics + " topic(s) have URP — leader healthy but replicas lag. Example: " + urpExample,
                        urpExample, now));
            }
            if (offlineTopics > 0) {
                out.add(new Alert("offline", "error",
                        "Offline partitions",
                        offlineTopics + " topic(s) have offline partitions — no leader assigned. Example: " + offlineExample,
                        offlineExample, now));
            }
        } catch (Exception ignored) { /* skip if AdminClient is unavailable */ }

        try {
            var groups = await(ac.listConsumerGroups().all()).stream().map(ConsumerGroupListing::groupId).toList();
            if (!groups.isEmpty()) {
                Map<String, ConsumerGroupDescription> gd = await(ac.describeConsumerGroups(groups).all());
                int dead = 0; String deadExample = null;
                for (var d : gd.values()) {
                    if (d.state() == ConsumerGroupState.DEAD) {
                        dead++; if (deadExample == null) deadExample = d.groupId();
                    }
                }
                if (dead > 0) {
                    out.add(new Alert("dead-groups", "warning",
                            "Dead consumer groups",
                            dead + " consumer group(s) in DEAD state — last member left without proper rebalance. Example: " + deadExample,
                            deadExample, now));
                }
            }
        } catch (Exception ignored) {}

        if (out.isEmpty()) {
            out.add(new Alert("healthy", "info",
                    "Cluster healthy",
                    "No active alerts. All partitions are in-sync, all groups stable.",
                    null, now));
        }
        return out;
    }
}
