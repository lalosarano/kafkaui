package com.kafkagui.cluster.dto;

public record ClusterTestResult(
        boolean ok,
        String error,
        String message,
        Integer brokerCount,
        Integer controllerId,
        String clusterId,
        Long latencyMs
) {
    public static ClusterTestResult success(int brokerCount, Integer controllerId, String clusterId, long latencyMs) {
        return new ClusterTestResult(true, null, null, brokerCount, controllerId, clusterId, latencyMs);
    }
    public static ClusterTestResult failure(String error, String message) {
        return new ClusterTestResult(false, error, message, null, null, null, null);
    }
}
