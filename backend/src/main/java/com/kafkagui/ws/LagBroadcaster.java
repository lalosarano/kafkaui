package com.kafkagui.ws;

import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.consumer.ConsumerGroupService;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

/**
 * Tracks subscriptions to /topic/lag/{clusterId}/{groupId} and broadcasts a
 * per-group lag snapshot at a fixed interval.
 */
@Component
public class LagBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(LagBroadcaster.class);
    private static final String DEST_PREFIX = "/topic/lag/";

    private record Key(String clusterId, String groupId) {}

    private final ConsumerGroupService groupService;
    private final SimpMessagingTemplate ws;
    private final java.util.Map<Key, Integer> subscriptions = new ConcurrentHashMap<>();

    public LagBroadcaster(ConsumerGroupService groupService, SimpMessagingTemplate ws) {
        this.groupService = groupService;
        this.ws = ws;
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        String dest = (String) event.getMessage().getHeaders().get("simpDestination");
        if (dest == null || !dest.startsWith(DEST_PREFIX)) return;
        String tail = dest.substring(DEST_PREFIX.length());
        int slash = tail.indexOf('/');
        if (slash <= 0 || slash == tail.length() - 1) return;
        Key key = new Key(tail.substring(0, slash), tail.substring(slash + 1));
        subscriptions.merge(key, 1, Integer::sum);
    }

    @Scheduled(fixedRateString = "${kafka-gui.ws.lag-broadcast-interval-ms:2000}")
    public void tick() {
        if (subscriptions.isEmpty()) return;
        Set<Key> snapshot = new HashSet<>(subscriptions.keySet());
        for (Key k : snapshot) {
            try {
                ClusterContext.set(k.clusterId());
                var detail = groupService.get(k.groupId());
                ws.convertAndSend(DEST_PREFIX + k.clusterId() + "/" + k.groupId(), java.util.Map.of(
                        "groupId", k.groupId(),
                        "clusterId", k.clusterId(),
                        "totalLag", detail.totalLag(),
                        "partitions", detail.assignments().stream()
                                .map(a -> java.util.Map.of("topic", a.topic(), "partition", a.partition(), "lag", a.lag()))
                                .toList(),
                        "ts", System.currentTimeMillis()
                ));
            } catch (Exception e) {
                log.debug("Lag tick failed for {}: {}", k, e.getMessage());
            } finally {
                ClusterContext.clear();
            }
        }
    }
}
