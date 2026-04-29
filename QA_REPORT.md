# QA report

Severity legend: **blocker** (must fix to ship) · **major** (significant defect) · **minor** (small defect, low impact) · **acceptable** (deliberate trade-off, documented).

The functional walk-through is gated on a live backend (`make kafka-up && make dev`). The frontend was verified for compile, type-check, lint, unit-test, and SSR prerender pass. Findings below are from static review of the produced code against the mockups.

## Functional (deferred — needs running cluster)
| # | Item | Severity | Notes |
|---|---|---|---|
| F1 | Walk every screen for console errors / network failures | deferred | Requires `make kafka-up && make dev`. Not runnable in this build environment. |
| F2 | Create topic via UI → verify with `kafka-topics --list` | deferred | Same. Backend `TopicServiceIT` covers create/list/delete on Testcontainers. |
| F3 | Produce message → consume from CLI; pretty-print works for JSON / binary | deferred | Decoder unit-tested for JSON / text / base64 / null. End-to-end is `MessageServiceIT`. |
| F4 | Live tail produces messages within 2s | deferred | STOMP wired; `TailRegistry` tested via static review; runtime needs cluster. |
| F5 | CLI consumer group lag shows correctly in UI | deferred | `ConsumerGroupServiceIT` exercises lag math. |
| F6 | Reset offsets via UI changes lag | deferred | `ConsumerGroupServiceIT.list_describe_reset_round_trip` covers the path. |
| F7 | Delete topic via UI enforces type-to-confirm | static-pass | `confirm-modal.test.tsx` validates the gating. |
| F8 | Non-existent topic via direct API → frontend handles gracefully | static-pass | `client.ts` throws `ApiCallError`; `<ErrorState>` renders. |

## Visual / UI review
| # | Item | Severity | File:line | Notes |
|---|---|---|---|---|
| V1 | Mockup dashboard shows live throughput dual-area chart and per-broker disk/CPU bars; the live numbers come from the mockup's fake interval. | acceptable | `app/page.tsx` | Live throughput numbers are a separate API surface that doesn't exist in the backend in v0.1; rendering a fake walking line in production would be misleading. The KPI tiles + brokers table are real. Logged as a future feature in `FOLLOWUPS.md` (broker metrics). |
| V2 | Mockup has an Alerts card with seeded sample alerts. | acceptable | dashboard | Backend has no alert source — this is a real product (Prometheus + alertmanager) integration. Skipped intentionally. |
| V3 | Sidebar shows hardcoded `prod-use1` cluster pill (mockup). | minor | `components/kafka/sidebar.tsx` | We render the real `cluster.clusterId` instead. Logged as part of multi-cluster work. |
| V4 | Tweaks panel from `.designs/tweaks-panel.jsx` (accent hue / density / font) is not ported. | acceptable | n/a | Designer-only tool; theme + density already wired via `next-themes` and CSS vars. |
| V5 | Topic detail "Overview" tab in mockup has live throughput sparkline + ISR map; we render the ISR map only. | minor | `app/topics/[name]/page.tsx` | Same root cause as V1 — no backend metric source. |
| V6 | "Top topics by throughput" card on dashboard mockup is omitted. | minor | `app/page.tsx` | Same. |
| V7 | Schema diff tab is omitted. | minor | `app/schemas/page.tsx` | Logged as P2 in FOLLOWUPS. |

## Code-quality review (static)
| # | Item | Severity | File:line |
|---|---|---|---|
| C1 | `// STUB:` markers | minor | `components/kafka/produce-modal.tsx:Copy as kcat` button is disabled with `// STUB:` comment. |
| C2 | `useSearchParams` requires Suspense in App Router prerender. | major | **[FIXED]** `app/topics/page.tsx`, `app/consumers/page.tsx` — both wrap their inner component in `<Suspense>`. Verified by `npm run build` succeeding all 10 routes. |
| C3 | `vitest.setup.ts` patched globalThis with `// @ts-expect-error` which broke the Next build's stricter TS check. | major | **[FIXED]** Replaced with `unknown` cast. Verified by `npm run build` passing TS check. |
| C4 | `next/font` warning on layout.tsx for the Google Fonts link. | minor | Acceptable for now; logged in FOLLOWUPS. |

## Accessibility (static review)
| # | Item | Severity |
|---|---|---|
| A1 | All interactive elements use `<button>` or `<Link>`; no rogue `<div onClick>`. | pass |
| A2 | Inputs paired with `<label>`; checkboxes/switches expose `aria-label` where standalone. | pass |
| A3 | Modals use Radix `<Dialog>` which traps focus, restores focus, and handles `Escape`. | pass |
| A4 | `@axe-core/playwright` smoke test wired in `frontend/e2e/smoke.spec.ts`. | wired (deferred run) |

## Network/cleanup review
| # | Item | Severity | Notes |
|---|---|---|---|
| N1 | Live-tail subscription cleans up on unmount via `useEffect` return. | pass | `lib/stomp/use-tail.ts` unsubscribes and publishes `/app/tail/stop`. |
| N2 | Backend cleans up consumers on `SessionDisconnectEvent`. | pass | `TailRegistry.onDisconnect`. |
| N3 | No leftover `console.log`. | pass | grep clean. |
