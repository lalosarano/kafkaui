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
import org.testcontainers.utility.DockerImageName;

/**
 * Base class for tests that need a real Kafka. Uses the Testcontainers singleton
 * pattern: ONE Kafka container is started for the whole test JVM and shared by
 * every IT class, so its mapped port stays constant. JUnit does not manage the
 * container lifecycle (no {@code @Testcontainers}/{@code @Container}); Ryuk reaps
 * it at JVM exit.
 *
 * <p>This matters because the Spring application context is cached and reused
 * across IT classes, and {@link com.kafkagui.cluster.ClusterRegistry} pools an
 * AdminClient + Producer per cluster id. A per-class container (different port
 * each class) would leave those pooled "default" clients pointing at a stopped
 * broker, which then reconnect-spam {@code NetworkClient} WARNs for the rest of
 * the suite. A single shared container keeps the pooled clients valid.
 */
@SpringBootTest
public abstract class AbstractKafkaIT {

    static final KafkaContainer KAFKA = new KafkaContainer(
            DockerImageName.parse("confluentinc/cp-kafka:7.5.3"));

    static {
        KAFKA.start();
    }

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
