package com.kafkagui.message;

import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.cluster.ClusterRegistry;
import com.kafkagui.config.ConsumerFactoryProvider;
import com.kafkagui.message.dto.Message;
import com.kafkagui.message.dto.ProduceRequest;
import com.kafkagui.message.dto.ProduceResult;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.OffsetAndTimestamp;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.PartitionInfo;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.stereotype.Service;

@Service
public class MessageService {

    private static final int POLL_TIMEOUT_MS = 2000;
    private static final int FETCH_DEADLINE_MS = 5000;

    private final ConsumerFactoryProvider consumerFactory;
    private final ClusterRegistry registry;
    private final MessageDecoder decoder;

    public MessageService(
            ConsumerFactoryProvider consumerFactory,
            ClusterRegistry registry,
            MessageDecoder decoder) {
        this.consumerFactory = consumerFactory;
        this.registry = registry;
        this.decoder = decoder;
    }

    public List<Message> fetch(
            String topic,
            Integer partition,
            Long fromOffset,
            Long fromTimestamp,
            String seek,
            int limit) {
        if (limit <= 0) limit = 100;
        if (limit > 1000) limit = 1000;
        String clusterId = ClusterContext.require();

        try (KafkaConsumer<byte[], byte[]> consumer = consumerFactory.create(clusterId, "fetch")) {
            List<TopicPartition> assigned = new ArrayList<>();
            // partitionsFor returns null or an empty list for a topic that doesn't exist
            // (which of the two depends on broker auto-create config and client version).
            List<PartitionInfo> infos = consumer.partitionsFor(topic);
            if (infos == null || infos.isEmpty()) {
                throw new org.apache.kafka.common.errors.UnknownTopicOrPartitionException(
                        "Topic not found: " + topic);
            }
            if (partition != null) {
                assigned.add(new TopicPartition(topic, partition));
            } else {
                for (PartitionInfo pi : infos) assigned.add(new TopicPartition(topic, pi.partition()));
            }
            consumer.assign(assigned);

            // Pre-fetch begin/end so we can clamp every seek into a valid range.
            Map<TopicPartition, Long> begins = consumer.beginningOffsets(assigned);
            Map<TopicPartition, Long> ends = consumer.endOffsets(assigned);
            for (TopicPartition tp : assigned) {
                long begin = begins.get(tp);
                long end = ends.get(tp);
                long target;
                if (fromOffset != null) {
                    target = fromOffset;
                } else if (fromTimestamp != null) {
                    Map<TopicPartition, OffsetAndTimestamp> resolved =
                            consumer.offsetsForTimes(Map.of(tp, fromTimestamp));
                    OffsetAndTimestamp ot = resolved.get(tp);
                    target = ot != null ? ot.offset() : end;
                } else if ("earliest".equalsIgnoreCase(seek)) {
                    target = begin;
                } else {
                    target = end - (long) limit;
                }
                long clamped = Math.max(begin, Math.min(end, target));
                consumer.seek(tp, clamped);
            }

            List<Message> out = new ArrayList<>(limit);
            long deadline = System.currentTimeMillis() + FETCH_DEADLINE_MS;
            while (out.size() < limit && System.currentTimeMillis() < deadline) {
                ConsumerRecords<byte[], byte[]> records = consumer.poll(Duration.ofMillis(POLL_TIMEOUT_MS));
                if (records.isEmpty()) break;
                for (ConsumerRecord<byte[], byte[]> r : records) {
                    out.add(toMessage(clusterId, r));
                    if (out.size() >= limit) break;
                }
            }
            return out;
        }
    }

    public ProduceResult produce(String topic, ProduceRequest req) {
        String clusterId = ClusterContext.require();
        byte[] keyBytes = req.key() != null ? req.key().getBytes(StandardCharsets.UTF_8) : null;
        byte[] valueBytes = decoder.encode(req.value());
        Iterable<Header> headers = new ArrayList<>();
        if (req.headers() != null) {
            List<Header> hs = new ArrayList<>();
            for (var e : req.headers().entrySet()) {
                hs.add(new RecordHeader(e.getKey(), e.getValue() == null ? null : e.getValue().getBytes(StandardCharsets.UTF_8)));
            }
            headers = hs;
        }
        ProducerRecord<byte[], byte[]> record = new ProducerRecord<>(
                topic, req.partition(), null, keyBytes, valueBytes, headers);
        try {
            RecordMetadata md = registry.producer(clusterId).send(record).get();
            return new ProduceResult(md.topic(), md.partition(), md.offset(), md.timestamp());
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(ie);
        } catch (ExecutionException ee) {
            Throwable cause = ee.getCause();
            if (cause instanceof RuntimeException re) throw re;
            throw new RuntimeException(cause);
        }
    }

    public Message toMessage(String clusterId, ConsumerRecord<byte[], byte[]> r) {
        Map<String, String> headers = new HashMap<>();
        for (Header h : r.headers()) {
            headers.put(h.key(), h.value() == null ? null : new String(h.value(), StandardCharsets.UTF_8));
        }
        var decoded = decoder.decode(clusterId, r.topic(), r.value());
        String key = decoder.decodeKey(r.key());
        int size = (r.key() != null ? r.key().length : 0) + (r.value() != null ? r.value().length : 0);
        return new Message(
                r.topic(),
                r.partition(),
                r.offset(),
                r.timestamp(),
                key,
                decoded.value(),
                decoded.format(),
                decoded.schemaId(),
                size,
                headers
        );
    }
}
