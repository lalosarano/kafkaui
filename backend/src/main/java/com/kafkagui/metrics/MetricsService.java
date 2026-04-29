package com.kafkagui.metrics;

import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.metrics.dto.ThroughputSeries;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class MetricsService {

    private final MetricsCollector collector;

    public MetricsService(MetricsCollector collector) {
        this.collector = collector;
    }

    public ThroughputSeries throughput() {
        String clusterId = ClusterContext.require();
        List<MetricsCollector.Sample> samples = collector.get(clusterId).snapshot();
        if (samples.size() < 2) {
            return new ThroughputSeries(List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
        }

        List<Long> ts = new ArrayList<>(samples.size() - 1);
        List<Double> in = new ArrayList<>(samples.size() - 1);
        List<Double> out = new ArrayList<>(samples.size() - 1);
        List<Double> bIn = new ArrayList<>(samples.size() - 1);
        List<Double> bOut = new ArrayList<>(samples.size() - 1);

        // Per-topic msgs/s sparklines (last 30 deltas, padded with zeros)
        Map<String, List<Double>> topicSpark = new LinkedHashMap<>();

        for (int i = 1; i < samples.size(); i++) {
            var prev = samples.get(i - 1);
            var cur = samples.get(i);
            double dtSec = Math.max(0.001, (cur.ts() - prev.ts()) / 1000.0);
            ts.add(cur.ts());
            in.add(Math.max(0, (cur.endSum() - prev.endSum()) / dtSec));
            out.add(Math.max(0, (cur.committedSum() - prev.committedSum()) / dtSec));
            double bytesIn = Math.max(0, (cur.bytesSum() - prev.bytesSum()) / dtSec);
            bIn.add(bytesIn);
            // Without separate ingress/egress stats, mirror bytes-out off committed-offset progress weighted by avg msg size.
            double avgMsgSize = cur.endSum() > 0 ? (double) cur.bytesSum() / cur.endSum() : 0;
            bOut.add(Math.max(0, (cur.committedSum() - prev.committedSum()) / dtSec * avgMsgSize));

            for (var e : cur.endByTopic().entrySet()) {
                long prevEnd = prev.endByTopic().getOrDefault(e.getKey(), e.getValue());
                double rate = Math.max(0, (e.getValue() - prevEnd) / dtSec);
                topicSpark.computeIfAbsent(e.getKey(), k -> new ArrayList<>()).add(rate);
            }
        }

        // Top topics by current rate
        var latest = samples.get(samples.size() - 1);
        List<ThroughputSeries.TopTopic> top = new ArrayList<>();
        for (var e : latest.endByTopic().entrySet()) {
            String name = e.getKey();
            List<Double> spark = topicSpark.getOrDefault(name, List.of());
            double rate = spark.isEmpty() ? 0 : spark.get(spark.size() - 1);
            long bytes = latest.bytesByTopic().getOrDefault(name, 0L);
            top.add(new ThroughputSeries.TopTopic(
                    name,
                    latest.partitionCounts().getOrDefault(name, 0),
                    e.getValue(),
                    rate,
                    bytesPerSecForTopic(samples, name),
                    0L,
                    spark
            ));
        }
        top.sort(Comparator.comparingDouble(ThroughputSeries.TopTopic::messagesPerSec).reversed());
        if (top.size() > MetricsCollector.TOP_TOPICS) top = top.subList(0, MetricsCollector.TOP_TOPICS);

        return new ThroughputSeries(ts, in, out, bIn, bOut, top);
    }

    private double bytesPerSecForTopic(List<MetricsCollector.Sample> samples, String topic) {
        if (samples.size() < 2) return 0;
        var prev = samples.get(samples.size() - 2);
        var cur = samples.get(samples.size() - 1);
        long b1 = cur.bytesByTopic().getOrDefault(topic, 0L);
        long b0 = prev.bytesByTopic().getOrDefault(topic, 0L);
        double dt = Math.max(0.001, (cur.ts() - prev.ts()) / 1000.0);
        return Math.max(0, (b1 - b0) / dt);
    }
}
