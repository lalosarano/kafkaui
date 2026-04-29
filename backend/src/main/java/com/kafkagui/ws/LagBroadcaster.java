package com.kafkagui.ws;

import com.kafkagui.consumer.ConsumerGroupService;
import com.kafkagui.consumer.dto.ConsumerGroupSummary;
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
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

/**
 * Tracks subscriptions to /topic/lag/{groupId} and broadcasts a per-group lag
 * snapshot to the matching destination on a fixed interval.
 */
@Component
public class LagBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(LagBroadcaster.class);
    private static final String DEST_PREFIX = "/topic/lag/";

    private final ConsumerGroupService groupService;
    private final SimpMessagingTemplate ws;

    /** groupId → ref count of active client subscriptions */
    private final java.util.Map<String, Integer> groups = new ConcurrentHashMap<>();

    public LagBroadcaster(ConsumerGroupService groupService, SimpMessagingTemplate ws) {
        this.groupService = groupService;
        this.ws = ws;
    }

    @EventListener
    public void onSubscribe(SessionSubscribeEvent event) {
        String dest = (String) event.getMessage().getHeaders().get("simpDestination");
        if (dest != null && dest.startsWith(DEST_PREFIX)) {
            String groupId = dest.substring(DEST_PREFIX.length());
            groups.merge(groupId, 1, Integer::sum);
        }
    }

    @EventListener
    public void onUnsubscribe(SessionUnsubscribeEvent event) {
        // SessionUnsubscribeEvent doesn't carry the destination — periodic GC instead.
    }

    @Scheduled(fixedRateString = "${kafka-gui.ws.lag-broadcast-interval-ms:2000}")
    public void tick() {
        if (groups.isEmpty()) return;
        Set<String> snapshot = new HashSet<>(groups.keySet());
        for (String groupId : snapshot) {
            try {
                var detail = groupService.get(groupId);
                ws.convertAndSend(DEST_PREFIX + groupId, java.util.Map.of(
                        "groupId", groupId,
                        "totalLag", detail.totalLag(),
                        "partitions", detail.assignments().stream()
                                .map(a -> java.util.Map.of("topic", a.topic(), "partition", a.partition(), "lag", a.lag()))
                                .toList(),
                        "ts", System.currentTimeMillis()
                ));
            } catch (Exception e) {
                log.debug("Lag tick failed for {}: {}", groupId, e.getMessage());
            }
        }
    }
}
