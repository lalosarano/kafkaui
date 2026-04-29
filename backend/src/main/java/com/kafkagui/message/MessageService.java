package com.kafkagui.message;

import com.kafkagui.config.ConsumerFactoryProvider;
import com.kafkagui.config.KafkaGuiProperties;
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
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.clients.producer.RecordMetadata;
import org.apache.kafka.common.PartitionInfo;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.header.Header;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.stereotype.Service;

@Service
public class MessageService {

    private final ConsumerFactoryProvider consumerFactory;
    private final Producer<byte[], byte[]> producer;
    private final MessageDecoder decoder;
    private final KafkaGuiProperties props;

    public MessageService(
            ConsumerFactoryProvider consumerFactory,
            Producer<byte[], byte[]> producer,
            MessageDecoder decoder,
            KafkaGuiProperties props) {
        this.consumerFactory = consumerFactory;
        this.producer = producer;
        this.decoder = decoder;
        this.props = props;
    }

    /** Historical fetch: assigns partition(s), seeks, polls until limit or timeout. */
    public List<Message> fetch(String topic, Integer partition, Long fromOffset, int limit) {
        if (limit <= 0) limit = 100;
        if (limit > 1000) limit = 1000;

        try (KafkaConsumer<byte[], byte[]> consumer = consumerFactory.create("fetch")) {
            List<TopicPartition> assigned = new ArrayList<>();
            List<PartitionInfo> infos = consumer.partitionsFor(topic);
            if (infos == null) {
                throw new org.apache.kafka.common.errors.UnknownTopicOrPartitionException(
                        "Topic not found: " + topic);
            }
            if (partition != null) {
                assigned.add(new TopicPartition(topic, partition));
            } else {
                for (PartitionInfo pi : infos) assigned.add(new TopicPartition(topic, pi.partition()));
            }
            consumer.assign(assigned);

            // Seek
            for (TopicPartition tp : assigned) {
                if (fromOffset != null) {
                    consumer.seek(tp, fromOffset);
                } else {
                    Map<TopicPartition, Long> end = consumer.endOffsets(List.of(tp));
                    long pos = Math.max(0, end.get(tp) - (long) limit);
                    consumer.seek(tp, pos);
                }
            }

            List<Message> out = new ArrayList<>(limit);
            long deadline = System.currentTimeMillis() + props.message().historicalFetchTimeoutMs();
            int pollMs = props.message().pollTimeoutMs();
            while (out.size() < limit && System.currentTimeMillis() < deadline) {
                ConsumerRecords<byte[], byte[]> records = consumer.poll(Duration.ofMillis(pollMs));
                if (records.isEmpty()) {
                    // first empty poll after a fast end → break early
                    break;
                }
                for (ConsumerRecord<byte[], byte[]> r : records) {
                    out.add(toMessage(r));
                    if (out.size() >= limit) break;
                }
            }
            return out;
        }
    }

    public ProduceResult produce(String topic, ProduceRequest req) {
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
            RecordMetadata md = producer.send(record).get();
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

    Message toMessage(ConsumerRecord<byte[], byte[]> r) {
        Map<String, String> headers = new HashMap<>();
        for (Header h : r.headers()) {
            headers.put(h.key(), h.value() == null ? null : new String(h.value(), StandardCharsets.UTF_8));
        }
        var decoded = decoder.decode(r.topic(), r.value());
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
