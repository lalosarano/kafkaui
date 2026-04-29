import { api } from "./client";
import type {
  CreateTopicRequest,
  PageResponse,
  Topic,
  TopicConfigEntry,
  TopicDetail,
} from "@/lib/types/kafka";

export const topicsApi = {
  list: (q: string | undefined, showInternal: boolean, page = 0, size = 100) =>
    api<PageResponse<Topic>>("/topics", { query: { q, showInternal, page, size } }),
  get: (name: string) => api<TopicDetail>(`/topics/${encodeURIComponent(name)}`),
  create: (req: CreateTopicRequest) => api<Topic>("/topics", { method: "POST", body: req }),
  delete: (name: string) =>
    api<void>(`/topics/${encodeURIComponent(name)}`, { method: "DELETE" }),
  configs: (name: string) => api<TopicConfigEntry[]>(`/topics/${encodeURIComponent(name)}/configs`),
  updateConfigs: (name: string, configs: Record<string, string>) =>
    api<TopicConfigEntry[]>(`/topics/${encodeURIComponent(name)}/configs`, {
      method: "PUT",
      body: configs,
    }),
};
