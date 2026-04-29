import type { ApiError } from "@/lib/types/kafka";
import { getActiveClusterId } from "@/lib/active-cluster";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080/api/v1";

export class ApiCallError extends Error {
  status: number;
  body: ApiError | null;
  constructor(status: number, body: ApiError | null, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type FetchOptions = Omit<RequestInit, "body"> & {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

export async function api<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = new URL(API_BASE + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const clusterId = getActiveClusterId();
  const init: RequestInit = {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(clusterId ? { "X-Cluster-Id": clusterId } : {}),
      ...(opts.headers ?? {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  };
  const res = await fetch(url.toString(), init);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const json = text ? safeParse(text) : null;
  if (!res.ok) {
    throw new ApiCallError(
      res.status,
      isApiError(json) ? json : null,
      isApiError(json) ? json.message : `HTTP ${res.status}`,
    );
  }
  return json as T;
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}
function isApiError(x: unknown): x is ApiError {
  return !!x && typeof x === "object" && "error" in x && "message" in x;
}
