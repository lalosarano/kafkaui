package com.kafkagui.message;

import static org.junit.jupiter.api.Assertions.*;

import com.kafkagui.AbstractKafkaIT;
import com.kafkagui.message.dto.Message;
import com.kafkagui.message.dto.ProduceRequest;
import com.kafkagui.topic.TopicService;
import com.kafkagui.topic.dto.CreateTopicRequest;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.stream.Collectors;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.errors.UnknownTopicOrPartitionException;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

class MessageServiceIT extends AbstractKafkaIT {

    @Autowired MessageService messageService;
    @Autowired TopicService topicService;

    @Value("${kafka-gui.bootstrap-servers}") String bootstrap;

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

    @Test
    void fetch_latest_is_fair_across_partitions() throws Exception {
        String multi = "fair-it-" + System.currentTimeMillis();
        topicService.create(new CreateTopicRequest(multi, 3, 1, Map.of()));

        Properties p = new Properties();
        p.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrap);
        p.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        p.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        long baseTs = 1_700_000_000_000L;
        try (KafkaProducer<String, String> producer = new KafkaProducer<>(p)) {
            // 30 records round-robined across 3 partitions with strictly increasing timestamps,
            // so the globally newest are v24..v29 spread over all three partitions.
            for (int i = 0; i < 30; i++) {
                producer.send(new ProducerRecord<>(multi, i % 3, baseTs + i, "k" + i, "v" + i)).get();
            }
        }

        List<Message> msgs = messageService.fetch(multi, null, null, null, null, 6);

        assertEquals(6, msgs.size());
        Set<String> values = msgs.stream().map(m -> String.valueOf(m.value())).collect(Collectors.toSet());
        assertEquals(Set.of("v24", "v25", "v26", "v27", "v28", "v29"), values);
        assertTrue(msgs.stream().map(Message::partition).distinct().count() > 1,
                "latest fetch should span multiple partitions, not drain just one");
    }
}
