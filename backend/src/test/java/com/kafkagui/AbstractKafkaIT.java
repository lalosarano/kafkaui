package com.kafkagui;

import com.kafkagui.cluster.ClusterContext;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for tests that need a real Kafka. Boots a single Confluent Kafka
 * Testcontainer for the JVM, seeds the cluster store with a "default" cluster
 * pointing at the container, and sets ClusterContext for each test method.
 */
@SpringBootTest
@Testcontainers
public abstract class AbstractKafkaIT {

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(
            DockerImageName.parse("confluentinc/cp-kafka:7.5.3"));

    static Path tempStore;

    @DynamicPropertySource
    static void registerKafkaProps(DynamicPropertyRegistry registry) throws IOException {
        tempStore = Files.createTempFile("kafkagui-clusters-", ".json");
        Files.deleteIfExists(tempStore);
        registry.add("kafka-gui.bootstrap-servers", KAFKA::getBootstrapServers);
        registry.add("kafka-gui.security-protocol", () -> "PLAINTEXT");
        registry.add("kafka-gui.cluster-store.path", () -> tempStore.toString());
    }

    @BeforeEach
    void setClusterContext() { ClusterContext.set("default"); }

    @AfterEach
    void clearClusterContext() { ClusterContext.clear(); }
}
