"use client";

import { useEffect, useRef, useState } from "react";
import { getStompClient } from "./client";
import type { Message } from "@/lib/types/kafka";

const MAX_BUFFER = 100;

export function useLiveTail(topic: string | null, enabled: boolean, paused: boolean) {
  const [messages, setMessages] = useState<Message[]>([]);
  const subRef = useRef<{ unsubscribe(): void } | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!topic || !enabled) return;
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
            setMessages((prev) => [msg, ...prev].slice(0, MAX_BUFFER));
          } catch { /* ignore malformed */ }
        });
        subRef.current = sub;
        client.publish({
          destination: "/app/tail/start",
          body: JSON.stringify({ topicName: topic }),
        });
      } catch { /* swallow connect errors; UI shows status */ }
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
    };
  }, [topic, enabled]);

  return { messages, clear: () => setMessages([]) };
}
