package com.kafkagui;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "kafka-gui.bootstrap-servers=localhost:0", // never actually connect
        "kafka-gui.request-timeout-ms=100"
})
class KafkaGuiApplicationTests {
    @Test
    void context_loads() {}
}
