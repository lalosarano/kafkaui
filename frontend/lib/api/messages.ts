import { api } from "./client";
import type { Message, ProduceRequest, ProduceResult } from "@/lib/types/kafka";

export const messagesApi = {
  fetch: (
    topic: string,
    opts: { partition?: number; fromOffset?: number; limit?: number } = {},
  ) =>
    api<Message[]>(`/topics/${encodeURIComponent(topic)}/messages`, {
      query: {
        partition: opts.partition,
        fromOffset: opts.fromOffset,
        limit: opts.limit ?? 100,
      },
    }),
  produce: (topic: string, req: ProduceRequest) =>
    api<ProduceResult>(`/topics/${encodeURIComponent(topic)}/messages`, {
      method: "POST",
      body: req,
    }),
};
