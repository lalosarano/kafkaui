"use client";

import { useEffect, useRef, useState } from "react";
import { getStompClient } from "./client";
import type { LagSnapshot } from "@/lib/types/kafka";

export function useLagStream(groupId: string | null) {
  const [snapshot, setSnapshot] = useState<LagSnapshot | null>(null);
  const subRef = useRef<{ unsubscribe(): void } | null>(null);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    (async () => {
      try {
        const client = await getStompClient();
        if (cancelled) return;
        subRef.current = client.subscribe(`/topic/lag/${groupId}`, (frame) => {
          try { setSnapshot(JSON.parse(frame.body) as LagSnapshot); } catch { /* ignore */ }
        });
      } catch { /* swallow */ }
    })();
    return () => {
      cancelled = true;
      subRef.current?.unsubscribe();
      subRef.current = null;
    };
  }, [groupId]);

  return snapshot;
}
