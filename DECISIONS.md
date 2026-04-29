# Decisions log

Format: **Title** — **Choice**, with one-line context and one-line reason.

## Stage 1 — Plan

- **Single cluster only** — the AdminClient is a single bean read from `application.yml`. *Multi-cluster is real work (registry, secret storage, switcher UI) and is logged as a separate followup so v0.1 can ship with a clean working slice.*
- **No auth in v0.1** — open backend, CORS to localhost:3000 only. *Auth is a cross-cutting feature; v0.1 is for local/dev use, prod deploy must front it with a proxy.*
- **Java 21 even though local toolchain is Java 8** — *Spec mandates 21. CI image and Docker build use 21; local devs install JDK 21 (one-line in README). I cannot run `mvn verify` in this environment — limitation logged in `TEST_RESULTS.md`.*
- **Maven, not Gradle** — spec mandated.
- **Lombok used sparingly** — DTOs prefer Java 21 records; Lombok only where builder/with patterns substantially reduce code.
- **STOMP over plain WebSocket** — easier server-side routing (`@MessageMapping`), broad client lib support, and the spec says "WebSocket (STOMP)".
- **`@stomp/stompjs` over `react-use-websocket`** — STOMP client, not raw WS.
- **TanStack Query for server state** — spec mandated; matches Next.js App Router patterns and gives us cache invalidation for free.
- **TanStack Table for tables** — spec mandated; powers `<DataTable>` reuse across all listing pages.
- **`react-json-view-lite` for JSON pretty-print** — spec mandated; lightweight, no dep on full `react-json-view`.
- **`cmdk` for command palette** — spec-implied (cmd+K); shadcn ships a `command` primitive that wraps it.
- **Type-to-confirm strings** — delete-topic confirms with the topic name; reset-offsets confirms with `RESET <group-id>` (slightly stricter than the mockup, which used the bare group id; the prefix prevents accidental copy-paste of a similar-looking identifier).
- **Live-tail backpressure** — the WS handler buffers up to 100 messages per (session, topic) and drops the oldest if the client falls behind. This is the simplest backpressure strategy and matches the "client-side pause/resume" mockup.
- **Per-request consumer for historical reads** — opens, assigns, seeks, polls until limit or 2s, closes. Trades a few ms per request for stateless code; production deployments handling hundreds of concurrent reads should pool. *Logged in FOLLOWUPS as a perf optimization.*
- **Schema Registry is optional** — startup must not fail if unset. Endpoints return `503 schema-registry-not-configured`.
- **Pagination only for topics** — brokers/groups/schemas/ACLs return whole list since clusters typically have <500 of each.
- **Compose uses KRaft mode** (no Zookeeper) — Kafka 3.7+ standard; matches mockup mention of `controller 1001`.
- **Frontend folder layout** — `app/` for routes, `components/ui/` for shadcn primitives, `components/kafka/` for domain components, `lib/api/` for typed API clients, `lib/types/` for DTOs, `hooks/` for custom hooks. Mirrors shadcn defaults + idiomatic Next 15.

## Stage 2 — Execute

(Append as we build.)
