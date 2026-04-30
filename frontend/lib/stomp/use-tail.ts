"use client";

import { useEffect, useRef, useState } from "react";
import { getActiveClusterId } from "@/lib/active-cluster";
import { getStompClient } from "./client";
import type { Message } from "@/lib/types/kafka";

export type TailStatus = "idle" | "connecting" | "connected" | "error";

export function useLiveTail(
  topic: string | null,
  enabled: boolean,
  paused: boolean,
  partition: number | null = null,
  bufferSize: number = 1000,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<TailStatus>("idle");
  const subRef = useRef<{ unsubscribe(): void } | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!topic || !enabled) {
      setStatus("idle");
      return;
    }
    setStatus("connecting");
    const clusterId = getActiveClusterId();
    let cancelled = false;
    let client: Awaited<ReturnType<typeof getStompClient>> | null = null;

    (async () => {
      try {
        client = await getStompClient();
        if (cancelled) return;
        const sub = client.subscribe(`/topic/messages/${topic}`, (frame) => {
          if (pausedRef.current) return;
          try {
            const msg = JSON.parse(frame.body) as Message;
            setMessages((prev) => [msg, ...prev].slice(0, bufferSize));
          } catch { /* malformed frame */ }
        });
        subRef.current = sub;
        client.publish({
          destination: "/app/tail/start",
          body: JSON.stringify({ clusterId, topicName: topic, partition }),
        });
        setStatus("connected");
      } catch {
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (subRef.current) {
        subRef.current.unsubscribe();
        subRef.current = null;
      }
      if (client?.connected && topic) {
        try {
          client.publish({
            destination: "/app/tail/stop",
            body: JSON.stringify({ topicName: topic }),
          });
        } catch { /* ignore */ }
      }
      setStatus("idle");
    };
  }, [topic, enabled, partition, bufferSize]);

  return { messages, status, clear: () => setMessages([]) };
}
