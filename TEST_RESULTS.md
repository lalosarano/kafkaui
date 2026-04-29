# Test results

## Final test run summary

| Suite | Result |
|---|---|
| Frontend Vitest (21 tests, 6 files) | **PASS** |
| Frontend ESLint | PASS (1 advisory warning, see below) |
| Frontend Next build (10 routes) | **PASS** |
| Frontend Playwright | NOT RUN (deferred — needs live cluster) |
| Backend Maven verify | NOT RUN (deferred — host has only Java 8, no Maven) |

## Final Vitest run (post-fixes)

```
 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  43.5s
```

## Frontend — Vitest (initial run)

```
$ cd frontend && npm test

 ✓ components/kafka/status-badge.test.tsx (3 tests)
 ✓ components/kafka/lag-indicator.test.tsx (3 tests)
 ✓ components/kafka/data-table.test.tsx (3 tests)
 ✓ components/kafka/confirm-modal.test.tsx (1 test)
 ✓ lib/format.test.ts (10 tests)
 ✓ app/dashboard.test.tsx (1 test)

 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  19.4s
```

## Frontend — Lint (`npm run lint`)

```
./app/layout.tsx
21:9  Warning: Custom fonts not added in `pages/_document.js` will only load for a single page.
```

This is a false-positive for the App Router; the `<head>` link tag in the root layout is the supported mechanism. Logged in `FOLLOWUPS.md` as a P3 (use `next/font` to silence).

## Frontend — Build (`npm run build`)

```
   ▲ Next.js 15.5.15

✓ Compiled successfully in 6.2s
✓ Generating static pages (10/10)

Route (app)                                 Size  First Load JS
┌ ○ /                                    3.57 kB         143 kB
├ ○ /_not-found                            123 B         102 kB
├ ○ /acls                                5.94 kB         152 kB
├ ○ /brokers                                5 kB         137 kB
├ ○ /consumers                           8.14 kB         154 kB
├ ○ /schemas                             3.06 kB         125 kB
├ ○ /settings                            1.03 kB         110 kB
├ ○ /topics                              5.81 kB         156 kB
└ ƒ /topics/[name]                       17.2 kB         161 kB
+ First Load JS shared by all             102 kB
```

All static pages prerender clean.

## Frontend — Playwright (`npx playwright test`)

**Not run in this environment.** Playwright requires:
- a built+running frontend on `localhost:3000`
- a running backend (or fully-mocked API)

The smoke spec at `frontend/e2e/smoke.spec.ts` is wired and ready; it walks dashboard → topics → topic detail and runs `@axe-core/playwright` against the dashboard. It must be exercised manually after `make kafka-up && make dev`.

## Backend — Maven verify (`cd backend && mvn verify`)

**Not run in this environment.** The build host has only Java 8 and no Maven. The `pom.xml` targets Java 21 and uses Testcontainers for the integration tests; both require a JDK 21 install and a running Docker daemon.

Suites that *will* run on a JDK 21 host:
- `MessageDecoderTest` (unit) — JSON/text/base64/null payload decoding paths
- `PageResponseTest` (unit) — slicing & normalization
- `KafkaGuiApplicationTests` (Spring context smoke)
- `ClusterServiceIT` (Testcontainers) — describe cluster
- `TopicServiceIT` (Testcontainers) — create/get/delete + list filter + unknown-topic error path
- `MessageServiceIT` (Testcontainers) — produce + fetch round-trip + unknown-topic error path
- `ConsumerGroupServiceIT` (Testcontainers) — list/describe/reset round-trip + unknown-group error path

**Verification command** (run on a host with JDK 21 + Docker):
```bash
cd backend && mvn -q verify
```
