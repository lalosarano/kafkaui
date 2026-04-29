package com.kafkagui.ws;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class TailController {

    private final TailRegistry registry;

    public TailController(TailRegistry registry) {
        this.registry = registry;
    }

    public record StartTail(String clusterId, String topicName, Integer partition) {}
    public record StopTail(String topicName) {}

    @MessageMapping("/tail/start")
    public void start(@Payload StartTail msg, SimpMessageHeaderAccessor headers) {
        String clusterId = msg.clusterId();
        if (clusterId == null || clusterId.isBlank()) {
            // STOMP CONNECT may have a session-level cluster header — fall back to that.
            Object sessionAttr = headers.getSessionAttributes() != null
                    ? headers.getSessionAttributes().get("clusterId") : null;
            if (sessionAttr instanceof String s) clusterId = s;
        }
        registry.start(headers.getSessionId(), clusterId, msg.topicName(), msg.partition());
    }

    @MessageMapping("/tail/stop")
    public void stop(@Payload StopTail msg, SimpMessageHeaderAccessor headers) {
        registry.stop(headers.getSessionId(), msg.topicName());
    }
}
