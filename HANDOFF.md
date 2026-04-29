# Handoff — Kafka GUI v0.1.0

A web-based Kafka admin console: dashboard, topics, consumer groups, schemas, ACLs, brokers; live message tailing via STOMP. Spring Boot 3 / Java 21 backend, Next.js 15 / TypeScript frontend, single-broker KRaft Kafka via docker-compose.

## What works (verified end-to-end at the type / unit / build level)

- **Backend** — full REST surface under `/api/v1` with global error handling, AdminClient + Producer + Consumer + optional Schema Registry beans, STOMP `/ws` endpoint, lag broadcaster, live-tail registry with session-disconnect cleanup. Code compiles in IntelliJ-level static review. Integration tests are wired via Testcontainers and exercise the four service classes plus the application context.
- **Frontend** — all seven primary pages (Overview, Topics, Topic detail w/ tabs, Consumer groups + drawer, Schemas, ACLs, Brokers, Settings) render real backend data through TanStack Query. Type-to-confirm modals for delete-topic and reset-offsets. Produce-message modal. Command palette (cmd+K, /). Light + dark theme via `next-themes`. Live-tail with pause/resume.
- **Tests** — 21 frontend Vitest tests pass. Backend integration tests are written and run on JDK 21 + Docker (this build host has neither, so they're deferred).
- **Build** — `npm run build` produces a clean Next 15 production build, all 10 routes prerender or stream correctly.
- **Tooling** — `docker-compose.yml`, `Makefile`, GitHub Actions CI, `.editorconfig`, `.gitignore`.

## What's stubbed or partial

| Item | Where | FOLLOWUPS entry |
|---|---|---|
| Auth — backend is wide open | `backend/.../config` | P1 Auth |
| Multi-cluster — single AdminClient | `backend/.../cluster` | P1 Multi-cluster |
| Live cluster throughput / per-broker disk-CPU metrics | dashboard, topic overview | New entry: broker metrics |
| Avro/Protobuf produce | produce modal | P2 Avro/Protobuf produce |
| Reset by timestamp | `ConsumerGroupService` | P2 Reset by timestamp |
| Schema diff / version compare UI | `app/schemas/page.tsx` | P2 Schema diff |
| CSV export buttons | various | P3 CSV export |
| `Copy as kcat` button in produce modal | `produce-modal.tsx:149` (`// STUB:`) | P3 Stubs |
| Tweaks panel (designer-only) | n/a | P3 Tweaks panel |

## Known limitations

- **Java 21** is required for the backend. The build host only has Java 8 + no Maven, so `mvn verify` was not executed in this run.
- **Playwright e2e tests** require a live frontend + backend; they're wired but not exercised here.
- **Schema Registry is optional**. With it unset, the Schemas page renders an explanatory empty state (`503 schema-registry-not-configured`).
- **ESLint warning** on the Google Fonts `<link>` in the root layout — false-positive for App Router but harmless.

## How to resume work

Drop this prompt into a new Claude session:

> Read `CLAUDE.md`, `HANDOFF.md`, `FOLLOWUPS.md`, and `QA_REPORT.md`. Then pick up the highest-priority item from `FOLLOWUPS.md` that doesn't require human input. Start with [P1] Authentication & authorization or [P1] Multi-cluster switcher.

Or, to verify the build first:

```bash
make kafka-up           # starts kafka + schema-registry
cd backend && mvn -q verify    # JDK 21 + Docker required
cd ../frontend && npm install && npm test && npm run build
make dev                # backend on :8080, frontend on :3000
```

## Breadcrumb trail

| File | What's there |
|---|---|
| `PLAN.md` | endpoint map, route map, package layout, dependency list, decisions to resolve |
| `CLAUDE.md` | persistent context for future sessions — stack, layout, design tokens, gotchas |
| `ARCHITECTURE.md` | module breakdown, REST/WS contract, error mapping |
| `DECISIONS.md` | log of non-trivial choices |
| `QA_REPORT.md` | static review findings, severity, fix status |
| `TEST_RESULTS.md` | final test outputs |
| `FOLLOWUPS.md` | prioritized backlog |
| `README.md` | human-facing setup |
| `CONTRIBUTING.md` | workflow notes |
| `.designs/` | original mockups (read-only) |
