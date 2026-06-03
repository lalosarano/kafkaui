package com.kafkagui.broker;

import static org.junit.jupiter.api.Assertions.*;

import com.kafkagui.AbstractKafkaIT;
import com.kafkagui.broker.dto.Broker;
import com.kafkagui.topic.TopicService;
import com.kafkagui.topic.dto.CreateTopicRequest;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class BrokerServiceIT extends AbstractKafkaIT {

    @Autowired BrokerService brokerService;
    @Autowired TopicService topicService;

    @Test
    void list_reports_per_broker_stats() {
        topicService.create(new CreateTopicRequest("brk-it-" + System.currentTimeMillis(), 3, 1, Map.of()));

        List<Broker> brokers = brokerService.list();
        assertFalse(brokers.isEmpty());

        Broker b = brokers.get(0);
        assertTrue(b.leaders() >= 3, "single broker should lead the 3 new partitions");
        assertTrue(b.partitions() >= b.leaders(), "hosted replicas must be >= led partitions");
        assertTrue(b.onlinePartitions() >= 3, "the new partitions are online");
        assertTrue(b.diskBytes() >= 0, "disk usage should be reported (>=0) or -1 if unsupported");
        // A single-broker cluster carries every replica/leader, so there is no skew.
        assertEquals(0.0, b.leaderSkew());
        assertEquals(0.0, b.partitionSkew());
    }

    @Test
    void configs_returns_the_full_broker_config_set() {
        List<Broker> brokers = brokerService.list();
        assertFalse(brokers.isEmpty());
        int id = brokers.get(0).id();

        var configs = brokerService.configs(id);
        assertTrue(configs.size() > 50, "a broker exposes hundreds of configs, not a curated subset");
        assertTrue(configs.stream().anyMatch(c -> c.name().equals("log.retention.ms")),
                "expected a well-known broker config to be present");
    }
}
