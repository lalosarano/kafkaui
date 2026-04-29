package com.kafkagui.ws;

import com.kafkagui.config.KafkaGuiProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WsConfig implements WebSocketMessageBrokerConfigurer {

    private final KafkaGuiProperties props;

    public WsConfig(KafkaGuiProperties props) {
        this.props = props;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String origins = props.cors() != null && props.cors().allowedOrigins() != null
                ? props.cors().allowedOrigins()
                : "http://localhost:3000";
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins.split(","))
                .withSockJS();
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins.split(","));
    }
}
