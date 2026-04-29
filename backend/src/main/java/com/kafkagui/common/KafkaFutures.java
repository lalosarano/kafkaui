package com.kafkagui.common;

import java.util.concurrent.ExecutionException;
import org.apache.kafka.common.KafkaFuture;

/** Bridges KafkaFuture's checked-exception API into our throwing-exception world. */
public final class KafkaFutures {
    private KafkaFutures() {}

    public static <T> T await(KafkaFuture<T> future) {
        try {
            return future.get();
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while waiting on Kafka", ie);
        } catch (ExecutionException ee) {
            Throwable cause = ee.getCause();
            if (cause instanceof RuntimeException re) throw re;
            if (cause instanceof Error err) throw err;
            throw new RuntimeException(cause);
        }
    }
}
