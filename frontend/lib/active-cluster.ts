"use client";

/**
 * Active cluster id, persisted to localStorage. Used by:
 *   - the api client to send X-Cluster-Id on every REST call
 *   - the STOMP client to scope live tail and lag streams
 *
 * Mutations dispatch a window event so subscribers can re-render without a
 * heavy global state library.
 */

const KEY = "kafkagui.activeClusterId";
const EVENT = "kafkagui:activeClusterChanged";

export function getActiveClusterId(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(KEY); } catch { return null; }
}

export function setActiveClusterId(id: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(KEY, id);
    else window.localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
  } catch { /* localStorage unavailable */ }
}

export function subscribeActiveCluster(handler: (id: string | null) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = (e: Event) => handler((e as CustomEvent<string | null>).detail);
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}
