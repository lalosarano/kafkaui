package com.kafkagui.topic;

import static org.junit.jupiter.api.Assertions.*;

import com.kafkagui.AbstractKafkaIT;
import com.kafkagui.topic.dto.CreateTopicRequest;
import java.util.Map;
import org.apache.kafka.common.errors.UnknownTopicOrPartitionException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class TopicServiceIT extends AbstractKafkaIT {

    @Autowired TopicService topicService;

    @Test
    void create_describe_delete_round_trip() {
        String name = "it-topic-" + System.currentTimeMillis();
        topicService.create(new CreateTopicRequest(name, 3, 1, Map.of("retention.ms", "60000")));

        var detail = topicService.get(name);
        assertEquals(name, detail.name());
        assertEquals(3, detail.partitions().size());
        assertFalse(detail.internal());
        assertTrue(detail.configs().stream().anyMatch(c -> c.name().equals("retention.ms") && c.value().equals("60000")));

        topicService.delete(name);
        // give the broker a moment to actually drop it
        try { Thread.sleep(500); } catch (InterruptedException ignored) {}
        assertThrows(UnknownTopicOrPartitionException.class, () -> topicService.get(name));
    }

    @Test
    void list_filters_and_paginates() {
        topicService.create(new CreateTopicRequest("alpha-list-1", 1, 1, Map.of()));
        topicService.create(new CreateTopicRequest("alpha-list-2", 1, 1, Map.of()));
        topicService.create(new CreateTopicRequest("zeta-list-1", 1, 1, Map.of()));

        var page = topicService.list("alpha", false, 0, 50);
        assertTrue(page.totalElements() >= 2);
        assertTrue(page.content().stream().allMatch(t -> t.name().startsWith("alpha")));
    }

    @Test
    void get_unknown_topic_throws() {
        assertThrows(UnknownTopicOrPartitionException.class,
                () -> topicService.get("does-not-exist-" + System.currentTimeMillis()));
    }
}
