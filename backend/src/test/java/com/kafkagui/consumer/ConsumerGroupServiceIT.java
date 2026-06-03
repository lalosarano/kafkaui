package com.kafkagui.consumer;

import static org.junit.jupiter.api.Assertions.*;

import com.kafkagui.AbstractKafkaIT;
import com.kafkagui.consumer.dto.ResetOffsetsRequest;
import com.kafkagui.message.MessageService;
import com.kafkagui.message.dto.ProduceRequest;
import com.kafkagui.topic.TopicService;
import com.kafkagui.topic.dto.CreateTopicRequest;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.errors.GroupIdNotFoundException;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

class ConsumerGroupServiceIT extends AbstractKafkaIT {

    @Autowired ConsumerGroupService groupService;
    @Autowired TopicService topicService;
    @Autowired MessageService messageService;

    @Value("${kafka-gui.bootstrap-servers}") String bootstrap;

    @Test
    void list_describe_reset_round_trip() throws Exception {
        String topic = "grp-it-" + System.currentTimeMillis();
        String groupId = "grp-it-consumer-" + System.currentTimeMillis();
        topicService.create(new CreateTopicRequest(topic, 1, 1, Map.of()));

        // produce 5 messages
        for (int i = 0; i < 5; i++) {
            messageService.produce(topic, new ProduceRequest("k" + i, "v" + i, Map.of(), null));
        }

        // run a brief consumer that commits, so the group exists with state=stable later
        Properties p = new Properties();
        p.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrap);
        p.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        p.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        p.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        p.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        p.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        try (KafkaConsumer<String, String> c = new KafkaConsumer<>(p)) {
            c.subscribe(List.of(topic));
            long deadline = System.currentTimeMillis() + 10_000;
            int seen = 0;
            while (seen < 5 && System.currentTimeMillis() < deadline) {
                var recs = c.poll(Duration.ofMillis(500));
                seen += recs.count();
            }
            c.commitSync();
        }

        var summaries = groupService.list(null, null);
        assertTrue(summaries.stream().anyMatch(s -> s.id().equals(groupId)));

        var detail = groupService.get(groupId);
        assertEquals(groupId, detail.id());

        var reset = groupService.resetOffsets(groupId, new ResetOffsetsRequest("earliest", null, topic, null));
        assertEquals(groupId, reset.groupId());
        assertEquals(topic, reset.topic());
        assertEquals(Long.valueOf(0L), reset.partitionOffsets().get(0));

        // The committed group must surface under its topic (drives the topic Consumers tab).
        var topicGroups = groupService.groupsForTopic(topic);
        assertTrue(topicGroups.stream().anyMatch(g -> g.groupId().equals(groupId) && g.assignedPartitions() >= 1),
                "the committed group should appear under its topic with an assigned partition");
    }

    @Test
    void describe_unknown_group_throws() {
        assertThrows(GroupIdNotFoundException.class,
                () -> groupService.get("does-not-exist-" + System.currentTimeMillis()));
    }
}
