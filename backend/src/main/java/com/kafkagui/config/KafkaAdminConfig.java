package com.kafkagui.config;

import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.config.SslConfigs;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
@EnableConfigurationProperties(KafkaGuiProperties.class)
public class KafkaAdminConfig {

    @Bean
    public Map<String, Object> kafkaCommonProps(KafkaGuiProperties props) {
        Map<String, Object> p = new HashMap<>();
        p.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, props.bootstrapServers());
        p.put(AdminClientConfig.CLIENT_ID_CONFIG, props.clientId());
        p.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, props.requestTimeoutMs());
        p.put(AdminClientConfig.SECURITY_PROTOCOL_CONFIG, props.securityProtocol());
        if (StringUtils.hasText(props.saslMechanism())) {
            p.put(SaslConfigs.SASL_MECHANISM, props.saslMechanism());
        }
        if (StringUtils.hasText(props.saslJaasConfig())) {
            p.put(SaslConfigs.SASL_JAAS_CONFIG, props.saslJaasConfig());
        }
        if (StringUtils.hasText(props.sslTruststoreLocation())) {
            p.put(SslConfigs.SSL_TRUSTSTORE_LOCATION_CONFIG, props.sslTruststoreLocation());
        }
        if (StringUtils.hasText(props.sslTruststorePassword())) {
            p.put(SslConfigs.SSL_TRUSTSTORE_PASSWORD_CONFIG, props.sslTruststorePassword());
        }
        return p;
    }

    @Bean(destroyMethod = "close")
    public AdminClient adminClient(Map<String, Object> kafkaCommonProps) {
        return AdminClient.create(kafkaCommonProps);
    }
}
