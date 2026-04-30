import { api } from "./client";
import type { Message, ProduceRequest, ProduceResult } from "@/lib/types/kafka";

export const messagesApi = {
  fetch: (
    topic: string,
    opts: {
      partition?: number;
      fromOffset?: number;
      fromTimestamp?: number;
      seek?: "earliest" | "latest";
      limit?: number;
    } = {},
  ) =>
    api<Message[]>(`/topics/${encodeURIComponent(topic)}/messages`, {
      query: {
        partition: opts.partition,
        fromOffset: opts.fromOffset,
        fromTimestamp: opts.fromTimestamp,
        seek: opts.seek,
        limit: opts.limit ?? 100,
      },
    }),
  produce: (topic: string, req: ProduceRequest) =>
    api<ProduceResult>(`/topics/${encodeURIComponent(topic)}/messages`, {
      method: "POST",
      body: req,
    }),
};
