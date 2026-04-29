# CLAUDE.md — Persistent context for future sessions

> Read this first whenever you reopen the project.

## Stack
- **Backend** Java 21, Spring Boot 3.2, Maven; Kafka 3.7 client (AdminClient, Producer, Consumer); STOMP WebSocket; Confluent Schema Registry client (optional).
- **Frontend** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, TanStack Query, TanStack Table, `@stomp/stompjs`, `cmdk`, `next-themes`, `react-json-view-lite`.
- **Local infra** docker-compose with single-broker Kafka (KRaft mode), Schema Registry, optional REST proxy.

## Repo layout
```
.
├── .designs/                # READ-ONLY mockups (don't modify)
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/kafkagui/...
├── frontend/
│   ├── package.json
│   ├── app/                 # routes
│   ├── components/{ui,kafka}
│   ├── lib/{api,types,stomp,utils}
│   └── hooks/
├── docker-compose.yml
├── Makefile
├── PLAN.md / DECISIONS.md / FOLLOWUPS.md / HANDOFF.md / QA_REPORT.md / TEST_RESULTS.md / ARCHITECTURE.md
└── README.md / CONTRIBUTING.md
```

## Run / test commands
```
make kafka-up       # docker-compose up -d
make dev            # backend (8080) + frontend (3000) in parallel
make test           # mvn -pl backend verify && npm --prefix frontend test
make build          # mvn package + next build
make kafka-down
make clean
```
Or directly:
- Backend: `cd backend && mvn spring-boot:run` · `mvn verify`
- Frontend: `cd frontend && npm install && npm run dev` · `npm run test` · `npm run build` · `npx playwright test`

## Design system quick reference (extracted from `.designs/styles.css`)
- **Fonts** Geist (sans) + JetBrains Mono (mono); body 13px, mono 12px.
- **Density** rows 32px compact / 38px comfortable; padding 12 / 14.
- **Radii** 4 / 6 / 8 / 10.
- **Tokens** OKLCH driven via CSS vars: `--bg`, `--bg-2`, `--bg-3`, `--surface`, `--border`, `--fg{,-2,-3,-4}`, `--accent{,-2,-bg,-soft,-fg}`, semantic `--green/--amber/--red/--violet` (+ `*-bg`).
- **Tones** healthy/stable=green; warning/rebalancing=amber; error/dead=red; internal=violet; gray for empty.
- **Status badges** `<StatusBadge state="stable|rebalancing|empty|dead|healthy|warning|error|internal"/>`.
- **Lag thresholds** 0–99 green; 100–9999 amber; 10000+ red. (`LagIndicator`)
- **Live-tail row** new rows get `tail-in` flash 1.1s. Pulse animation on connection dot 2.4s.
- **Buttons** primary (accent fill), default (border + surface), ghost, danger; `data-size="sm|lg"`.
- **Modals** centered, `max-width: 540px` (lg = 720); type-to-confirm pattern is the standard for destructive ops.
- **Cmd+K** opens with both `cmd/ctrl+k` and `/`. Escape closes. ↑↓ navigate, ↵ select.

## Naming conventions
- Backend: package-by-feature (`topic`, `consumer`, `schema`, …); DTOs as records in `<feature>/dto/`; controllers as `<Feature>Controller`; services as `<Feature>Service`. Avoid Lombok where Java records suffice.
- Frontend: `kebab-case` files for routes, `PascalCase` for components; one file per shadcn primitive in `components/ui/`; one file per resource in `lib/api/`; types in `lib/types/kafka.ts` mirror backend DTOs verbatim.
- Tests live next to source: backend `src/test/java/...` matching package; frontend `*.test.tsx` next to component or in `__tests__/`.

## Component conventions
- Server state: TanStack Query, query keys are tuples `["topics", filters]`. Mutations invalidate the parent list query plus the detail query.
- Tables: shared `<DataTable>` accepts `columns`, `data`, optional `getRowId`, `enableSelection`, `enableSorting`, `enablePagination`. Backed by `@tanstack/react-table`.
- API client: thin `fetchJson<T>(url, opts)` wrapper in `lib/api/client.ts`; one file per resource. No axios.
- WS: single `useStompClient` hook holds the connection; per-feature hooks subscribe to the right destinations.
- Theming: `next-themes` with `class` strategy; tokens via `:root` and `.dark` set on `<html>`. Both must work everywhere.
- Forms: controlled inputs; type-to-confirm when destructive.

## Gotchas (append-only — the build agent will fill this in)

- **Java toolchain:** project targets Java 21. Local dev box may have only Java 8/11 — CI and Docker images use 21. If `mvn verify` fails with "release version 21 not supported", install JDK 21 and set `JAVA_HOME`.
- **Kafka in KRaft mode** (no Zookeeper) requires the `KAFKA_PROCESS_ROLES`, `KAFKA_NODE_ID`, `KAFKA_CONTROLLER_QUORUM_VOTERS`, and a formatted log dir. The compose file handles this.
- **Schema Registry is optional.** If `kafka-gui.schema-registry.url` is missing, schema endpoints return 503 with a typed error — don't crash on startup.
- **Live-tail consumer leak risk.** Every `/app/tail/start` opens a Kafka consumer; the matching `/app/tail/stop` (or session disconnect) closes it. The `TailRegistry` keys consumers by `(sessionId, topic)` and cleans up via `SessionDisconnectEvent`.
- **`@stomp/stompjs` v7** uses `client.activate()`, NOT `client.connect()`. Headers on subscribe are required for some brokers; we send none.
- **`react-json-view-lite`** does NOT support clipboard out of the box — copy is implemented via `navigator.clipboard.writeText` in our wrapper.
- **CORS** is open to `http://localhost:3000` only. The browser will block calls from any other origin in dev. For LAN testing, add origins to `application.yml`.
- **Windows newlines.** `.editorconfig` enforces LF; ensure git's `core.autocrlf` is `input` on Windows.
- **`next dev` on port collisions.** Default 3000; if taken, prefix command with `PORT=3001`.
- **Type-to-confirm** for delete-topic requires the user to type the *exact* topic name (case-sensitive). For reset-offsets, `RESET <group-id>` (this is stricter than the mockup which only types group id; we tightened it).
