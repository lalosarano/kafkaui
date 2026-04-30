package com.kafkagui.ws;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WsConfig implements WebSocketMessageBrokerConfigurer {

    private final String[] origins;

    public WsConfig(@Value("${kafka-gui.cors.allowed-origins:http://localhost:3000}") String allowed) {
        this.origins = allowed.split(",");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOriginPatterns(origins).withSockJS();
        registry.addEndpoint("/ws").setAllowedOriginPatterns(origins);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // Bump from defaults (64KB / 512KB / 10s) so live tail sustains a long burst
        // without Spring closing the session for being too slow to drain.
        registration.setMessageSizeLimit(256 * 1024);
        registration.setSendBufferSizeLimit(8 * 1024 * 1024);
        registration.setSendTimeLimit(20_000);
    }
}
