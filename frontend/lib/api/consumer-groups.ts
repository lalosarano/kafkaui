import { api } from "./client";
import type {
  ConsumerGroupDetail,
  ConsumerGroupSummary,
  ResetOffsetsRequest,
  ResetOffsetsResult,
} from "@/lib/types/kafka";

export const consumerGroupsApi = {
  list: (state?: string, q?: string) =>
    api<ConsumerGroupSummary[]>("/consumer-groups", { query: { state, q } }),
  get: (id: string) => api<ConsumerGroupDetail>(`/consumer-groups/${encodeURIComponent(id)}`),
  resetOffsets: (id: string, req: ResetOffsetsRequest) =>
    api<ResetOffsetsResult>(`/consumer-groups/${encodeURIComponent(id)}/reset-offsets`, {
      method: "POST",
      body: req,
    }),
  delete: (id: string) =>
    api<void>(`/consumer-groups/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
