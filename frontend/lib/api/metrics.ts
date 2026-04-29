import { api } from "./client";
import type { Alert, ThroughputSeries } from "@/lib/types/kafka";

export const metricsApi = {
  throughput: () => api<ThroughputSeries>("/metrics/throughput"),
};

export const alertsApi = {
  list: () => api<Alert[]>("/alerts"),
};
