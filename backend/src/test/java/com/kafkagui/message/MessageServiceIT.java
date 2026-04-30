package com.kafkagui.message;

import static org.junit.jupiter.api.Assertions.*;

import com.kafkagui.AbstractKafkaIT;
import com.kafkagui.message.dto.ProduceRequest;
import com.kafkagui.topic.TopicService;
import com.kafkagui.topic.dto.CreateTopicRequest;
import java.util.List;
import java.util.Map;
import org.apache.kafka.common.errors.UnknownTopicOrPartitionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class MessageServiceIT extends AbstractKafkaIT {

    @Autowired MessageService messageService;
    @Autowired TopicService topicService;

    private String topic;

    @BeforeEach
    void setup() {
        topic = "msg-it-" + System.currentTimeMillis();
        topicService.create(new CreateTopicRequest(topic, 1, 1, Map.of()));
    }

    @Test
    void produce_then_fetch_returns_message() {
        var produced = messageService.produce(topic, new ProduceRequest("k1", "{\"hello\":\"world\"}",
                Map.of("x-trace", "abc"), null));
        assertEquals(0, produced.partition());
        assertTrue(produced.offset() >= 0);

        var msgs = messageService.fetch(topic, 0, 0L, null, null, 10);
        assertFalse(msgs.isEmpty());
        var m = msgs.get(0);
        assertEquals("k1", m.key());
        assertEquals("json", m.valueFormat());
        assertEquals("abc", m.headers().get("x-trace"));
    }

    @Test
    void fetch_unknown_topic_throws() {
        assertThrows(UnknownTopicOrPartitionException.class,
                () -> messageService.fetch("nope-" + System.currentTimeMillis(), null, null, null, null, 5));
    }
}
