import { api } from "./client";
import type { ClusterInfo } from "@/lib/types/kafka";

export const clusterApi = {
  current: () => api<ClusterInfo>("/clusters/current"),
};
