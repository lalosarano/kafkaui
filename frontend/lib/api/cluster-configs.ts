import { api } from "./client";
import type { ClusterConfig, ClusterTestResult } from "@/lib/types/kafka";

export const clusterConfigsApi = {
  list: () => api<ClusterConfig[]>("/cluster-configs"),
  get: (id: string) => api<ClusterConfig>(`/cluster-configs/${encodeURIComponent(id)}`),
  create: (req: Partial<ClusterConfig>) =>
    api<ClusterConfig>("/cluster-configs", { method: "POST", body: req }),
  update: (id: string, req: Partial<ClusterConfig>) =>
    api<ClusterConfig>(`/cluster-configs/${encodeURIComponent(id)}`, { method: "PUT", body: req }),
  delete: (id: string) =>
    api<void>(`/cluster-configs/${encodeURIComponent(id)}`, { method: "DELETE" }),
  test: (req: Partial<ClusterConfig>) =>
    api<ClusterTestResult>("/cluster-configs/test", { method: "POST", body: req }),
};
