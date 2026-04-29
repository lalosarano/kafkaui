# Followups

Format per item:

```
## [PRIORITY] Short title
**Where:** file paths
**What:** current behavior
**Why it matters:** impact
**Suggested approach:** how to tackle it
**Estimated scope:** S / M / L
```

Priorities: P0 critical, P1 important, P2 nice-to-have, P3 polish.

---

## [P1] Authentication & authorization
**Where:** `backend/src/main/java/com/kafkagui/config/SecurityConfig.java` (does not exist), all controllers, `frontend/app/**`
**What:** No auth. CORS open to localhost:3000. Anybody who can hit the backend can administer Kafka.
**Why it matters:** Cannot ship to anyone outside trusted networks. Reset-offsets and delete-topic are destructive.
**Suggested approach:** Spring Security with a header-trust filter (`X-User`, `X-Roles`) behind an OAuth2 reverse proxy. Frontend reads user from `/api/v1/me` and renders avatar. Add per-action role checks via `@PreAuthorize`.
**Estimated scope:** M

## [P1] Multi-cluster switcher
**Where:** `backend/src/main/java/com/kafkagui/cluster`, `frontend/components/kafka/cluster-switcher.tsx`, sidebar header
**What:** Single AdminClient from `application.yml`. The mockup shows a cluster picker in the sidebar header (prod-use1, etc).
**Why it matters:** Most teams run dev/staging/prod; a single-cluster tool is half the value.
**Suggested approach:** Introduce `ClusterRegistry` bean caching `AdminClient` per cluster id. Persist cluster configs (encrypted SASL secrets!) to Postgres. Add `/api/v1/clusters` CRUD. Frontend stores selected cluster in cookie + URL param.
**Estimated scope:** L

## [P2] Pooled historical-message consumer
**Where:** `backend/src/main/java/com/kafkagui/message/MessageService.java`
**What:** Opens a fresh `KafkaConsumer` per `GET /topics/{name}/messages` request.
**Why it matters:** Adds 50–200ms per request and creates churn under load. OK for v0.1 (low-QPS admin tool).
**Suggested approach:** `GenericObjectPool<KafkaConsumer>` keyed by deserializer pair, borrowed/returned per request, with `assign()`+`seek()` reset on borrow.
**Estimated scope:** S

## [P2] Avro/Protobuf produce in the produce modal
**Where:** `frontend/components/kafka/produce-modal.tsx`, `backend/src/main/java/com/kafkagui/message/MessageController.java`
**What:** Produce-modal accepts JSON or text only. Avro tab is wired but the backend treats the value as a string.
**Why it matters:** Real Avro topics need a registered subject + schema id wrap.
**Suggested approach:** Backend resolves `<topic>-value` from registry, encodes Avro, prepends magic byte + id; surface schema-mismatch errors back to the UI.
**Estimated scope:** M

## [P2] Schema diff is hardcoded sample
**Where:** `frontend/app/schemas/page.tsx` Diff tab
**What:** Renders a static example diff (mockup-style).
**Why it matters:** Real Avro/JSON schema diffs would need a tree-aware diff.
**Suggested approach:** Use `diff` library on canonicalized JSON, render side-by-side or unified.
**Estimated scope:** M

## [P2] Server-side topic search & sort
**Where:** `backend/src/main/java/com/kafkagui/topic/TopicController.java`
**What:** `GET /topics` filters by name substring server-side but sorts client-side.
**Why it matters:** Fine for <500 topics; awkward at thousands.
**Suggested approach:** Accept `?sort=name,desc` query param; sort in service.
**Estimated scope:** S

## [P2] Reset-offsets to specific timestamp
**Where:** `backend/src/main/java/com/kafkagui/consumer/ConsumerGroupService.java`, frontend reset modal
**What:** "By timestamp" radio is in the modal but service rejects it (`UnsupportedOperationException`).
**Why it matters:** Common operational need.
**Suggested approach:** Use `AdminClient.listOffsets` with `OffsetSpec.forTimestamp(ms)` per partition, then `alterConsumerGroupOffsets` with the resolved offsets.
**Estimated scope:** S

## [P2] Lag broadcaster runs even with no subscribers
**Where:** `backend/src/main/java/com/kafkagui/ws/LagBroadcaster.java`
**What:** `@Scheduled(fixedRate=2000)` runs every 2s regardless of whether anyone is listening.
**Why it matters:** Burns AdminClient calls and CPU when idle.
**Suggested approach:** Subscribe to `SessionSubscribeEvent`/`SessionUnsubscribeEvent`, maintain a set of `groupId` → ref-count, only describe groups with refcount>0.
**Estimated scope:** S

## [P2] @stomp/stompjs reconnect & UX
**Where:** `frontend/lib/stomp/client.ts`
**What:** Reconnect delay set to 5s; no UI feedback during reconnect.
**Why it matters:** Live tail can silently disappear after a network blip.
**Suggested approach:** Surface connection state in topbar status pill; fall back from `Connected · 14ms` to `Reconnecting…`.
**Estimated scope:** S

## [P3] Stub: `// STUB:` markers
**Where:** any file containing `// STUB:` (grep on completion)
**What:** Temporary stand-ins flagged during build.
**Why it matters:** Unfinished work hidden in code.
**Suggested approach:** Audit, replace with real implementation or remove.
**Estimated scope:** varies

## [P3] No persistent settings
**Where:** `frontend/app/settings/page.tsx`
**What:** Settings page is read-only and shows `application.yml` values.
**Why it matters:** Mockup hints at editable preferences (theme is via Tweaks panel; everything else is server-side).
**Suggested approach:** Move user-level preferences (theme, density) into a `localStorage` profile; cluster configs stay server-side.
**Estimated scope:** S

## [P3] Tweaks panel from mockup
**Where:** `.designs/tweaks-panel.jsx`
**What:** Live design-tweaks panel (accent hue, density, font) is dev-only and not ported. Theme is wired via `next-themes`; density is wired via `data-density` on `<html>`.
**Why it matters:** Nice-to-have for designer review; not user-facing.
**Suggested approach:** Skip for production. If desired, drop a `<TweaksPanel>` mounted only when `process.env.NODE_ENV !== "production"`.
**Estimated scope:** M (skip for now)

## [P3] Playwright a11y not in CI for all routes
**Where:** `frontend/e2e/a11y.spec.ts`
**What:** Axe runs against dashboard + topic detail; other routes uncovered.
**Why it matters:** Regression risk on less-trafficked screens.
**Suggested approach:** Loop the spec across the route map.
**Estimated scope:** S

## [P3] No CSV export
**Where:** Topics, ACLs, and Consumer-groups pages each have an Export button.
**What:** Button is wired but does nothing.
**Why it matters:** Mockup feature; minor utility.
**Suggested approach:** Build a CSV blob from current TanStack Table state, trigger download.
**Estimated scope:** S

## [P3] Sidebar cluster picker is non-functional
**Where:** `frontend/components/kafka/sidebar.tsx`
**What:** Header shows "prod-use1" hardcoded — see "multi-cluster" item above.
**Why it matters:** Cosmetic until multi-cluster lands.
**Suggested approach:** Tied to multi-cluster work.
**Estimated scope:** Tied to multi-cluster.

---

## [P2] Live cluster / topic throughput metrics
**Where:** dashboard `app/page.tsx`, topic detail `app/topics/[name]/page.tsx`
**What:** mockup shows live messages/sec and bytes/sec dual-area charts; we render only static cluster info (broker count, topic count, etc.) — backend has no metrics endpoint.
**Why it matters:** the dashboard feels stripped-down vs. the mockup.
**Suggested approach:** scrape JMX via Prometheus or use Kafka's MBean exports; expose `/metrics/throughput?window=60s` on the backend; render the existing `<DualAreaChart>` component.
**Estimated scope:** L

## [P2] Per-broker disk / CPU / network metrics
**Where:** dashboard, brokers page
**What:** mockup shows disk %, CPU %, MB/s per broker; we list ID, host, rack, role only.
**Why it matters:** capacity planning is the operator's main use case for the brokers page.
**Suggested approach:** the kafka-clients lib doesn't expose host metrics — needs Prometheus + node-exporter integration or Kafka's `kafka.server` JMX MBeans.
**Estimated scope:** L

## [P3] Use `next/font` instead of `<link>` for Geist + JetBrains Mono
**Where:** `frontend/app/layout.tsx`
**What:** ESLint warns about page-custom-font; the app works but the warning is noise.
**Why it matters:** cleaner CI logs.
**Suggested approach:** move to `next/font/google` (`Geist` is on Google Fonts) and `next/font/local` for JetBrains Mono.
**Estimated scope:** S

---

## Build-time additions (tooling outside the original stack)

(none — every dependency was in PLAN.md)
