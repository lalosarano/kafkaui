package com.kafkagui.cluster;

/** Per-request cluster id (set by ClusterContextFilter, read by services). */
public final class ClusterContext {

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private ClusterContext() {}

    public static void set(String clusterId) { CURRENT.set(clusterId); }
    public static void clear() { CURRENT.remove(); }
    public static String get() { return CURRENT.get(); }

    public static String require() {
        String id = CURRENT.get();
        if (id == null || id.isBlank()) {
            throw new IllegalStateException("No cluster id set on this thread (expected X-Cluster-Id header)");
        }
        return id;
    }
}
