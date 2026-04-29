package com.kafkagui.ws;

import com.kafkagui.config.ConsumerFactoryProvider;
import com.kafkagui.config.KafkaGuiProperties;
import com.kafkagui.message.MessageService;
import com.kafkagui.message.dto.Message;
import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.PartitionInfo;
import org.apache.kafka.common.TopicPartition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/**
 * Tracks per-(session, topic) live-tail consumers. Each tail runs in a dedicated
 * thread, polls Kafka, and pushes records to /topic/messages/{topicName}. The
 * registry cleans up consumers on /app/tail/stop or session disconnect.
 */
@Component
public class TailRegistry {

    private static final Logger log = LoggerFactory.getLogger(TailRegistry.class);

    private record Key(String sessionId, String topic) {}

    private final Map<Key, Tail> tails = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    private final ConsumerFactoryProvider consumerFactory;
    private final MessageService messageService;
    private final SimpMessagingTemplate ws;
    private final KafkaGuiProperties props;

    public TailRegistry(ConsumerFactoryProvider consumerFactory,
                        MessageService messageService,
                        SimpMessagingTemplate ws,
                        KafkaGuiProperties props) {
        this.consumerFactory = consumerFactory;
        this.messageService = messageService;
        this.ws = ws;
        this.props = props;
    }

    public void start(String sessionId, String topic, Integer partition) {
        Key key = new Key(sessionId, topic);
        if (tails.containsKey(key)) return;

        KafkaConsumer<byte[], byte[]> consumer = consumerFactory.create("tail");
        Tail tail = new Tail(consumer, key, partition);
        tails.put(key, tail);
        executor.submit(tail);
    }

    public void stop(String sessionId, String topic) {
        Key key = new Key(sessionId, topic);
        Tail t = tails.remove(key);
        if (t != null) t.stop();
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        tails.entrySet().removeIf(e -> {
            if (e.getKey().sessionId().equals(sessionId)) {
                e.getValue().stop();
                return true;
            }
            return false;
        });
    }

    @PreDestroy
    public void shutdown() {
        tails.values().forEach(Tail::stop);
        tails.clear();
        executor.shutdownNow();
    }

    private final class Tail implements Runnable {
        private final KafkaConsumer<byte[], byte[]> consumer;
        private final Key key;
        private final Integer partition;
        private volatile boolean running = true;

        Tail(KafkaConsumer<byte[], byte[]> c, Key k, Integer p) {
            this.consumer = c;
            this.key = k;
            this.partition = p;
        }

        void stop() {
            running = false;
            try { consumer.wakeup(); } catch (Exception ignored) {}
        }

        @Override
        public void run() {
            try {
                List<TopicPartition> assigned = new java.util.ArrayList<>();
                List<PartitionInfo> infos = consumer.partitionsFor(key.topic());
                if (infos == null) {
                    log.warn("Topic not found for tail: {}", key.topic());
                    return;
                }
                if (partition != null) {
                    assigned.add(new TopicPartition(key.topic(), partition));
                } else {
                    for (PartitionInfo pi : infos) assigned.add(new TopicPartition(key.topic(), pi.partition()));
                }
                consumer.assign(assigned);
                Map<TopicPartition, Long> ends = consumer.endOffsets(assigned);
                for (TopicPartition tp : assigned) consumer.seek(tp, ends.get(tp));

                int pollMs = props.message().pollTimeoutMs();
                String dest = "/topic/messages/" + key.topic();
                while (running && !Thread.currentThread().isInterrupted()) {
                    ConsumerRecords<byte[], byte[]> records;
                    try {
                        records = consumer.poll(Duration.ofMillis(pollMs));
                    } catch (org.apache.kafka.common.errors.WakeupException w) {
                        break;
                    }
                    for (ConsumerRecord<byte[], byte[]> r : records) {
                        Message m = messageService.toMessage(r);
                        ws.convertAndSend(dest, m);
                    }
                }
            } catch (Exception e) {
                log.warn("Tail loop error for {}: {}", key, e.getMessage());
            } finally {
                try { consumer.close(); } catch (Exception ignored) {}
            }
        }
    }
}
