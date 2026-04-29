package com.kafkagui;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for tests that need a real Kafka. Starts a Confluent Kafka
 * container once per JVM (Testcontainers shared instance) and points the
 * Spring AdminClient at it.
 */
@SpringBootTest
@Testcontainers
public abstract class AbstractKafkaIT {

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(
            DockerImageName.parse("confluentinc/cp-kafka:7.5.3"));

    @DynamicPropertySource
    static void registerKafkaProps(DynamicPropertyRegistry registry) {
        registry.add("kafka-gui.bootstrap-servers", KAFKA::getBootstrapServers);
        registry.add("kafka-gui.security-protocol", () -> "PLAINTEXT");
    }
}
