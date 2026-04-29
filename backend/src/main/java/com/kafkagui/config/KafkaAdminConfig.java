package com.kafkagui.config;

import java.util.Properties;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.config.SslConfigs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class KafkaAdminConfig {

    private static final Logger log = LoggerFactory.getLogger(KafkaAdminConfig.class);

    /**
     * Holder for Kafka client properties. Concrete class (not a raw Map) so that
     * Spring doesn't treat the bean as a "map-of-beans" injection target.
     */
    public static class KafkaProps extends Properties {}

    @Bean
    public KafkaProps kafkaCommonProps(
            @Value("${kafka-gui.bootstrap-servers}") String bootstrapServers,
            @Value("${kafka-gui.client-id:kafka-gui}") String clientId,
            @Value("${kafka-gui.request-timeout-ms:10000}") int requestTimeoutMs,
            @Value("${kafka-gui.security-protocol:PLAINTEXT}") String securityProtocol,
            @Value("${kafka-gui.sasl-mechanism:}") String saslMechanism,
            @Value("${kafka-gui.sasl-jaas-config:}") String saslJaasConfig,
            @Value("${kafka-gui.ssl-truststore-location:}") String sslTruststoreLocation,
            @Value("${kafka-gui.ssl-truststore-password:}") String sslTruststorePassword) {
        log.info("Configuring Kafka client for bootstrap servers: {}", bootstrapServers);
        KafkaProps p = new KafkaProps();
        p.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        p.put(AdminClientConfig.CLIENT_ID_CONFIG, clientId);
        p.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, requestTimeoutMs);
        p.put(AdminClientConfig.SECURITY_PROTOCOL_CONFIG, securityProtocol);
        if (StringUtils.hasText(saslMechanism)) p.put(SaslConfigs.SASL_MECHANISM, saslMechanism);
        if (StringUtils.hasText(saslJaasConfig)) p.put(SaslConfigs.SASL_JAAS_CONFIG, saslJaasConfig);
        if (StringUtils.hasText(sslTruststoreLocation)) p.put(SslConfigs.SSL_TRUSTSTORE_LOCATION_CONFIG, sslTruststoreLocation);
        if (StringUtils.hasText(sslTruststorePassword)) p.put(SslConfigs.SSL_TRUSTSTORE_PASSWORD_CONFIG, sslTruststorePassword);
        return p;
    }

    @Bean(destroyMethod = "close")
    public AdminClient adminClient(KafkaProps kafkaCommonProps) {
        return AdminClient.create(kafkaCommonProps);
    }
}
