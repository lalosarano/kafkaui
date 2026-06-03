# Contributing

## Local setup

Prerequisites: Docker (for the containerized app), or Java 21 + Maven 3.9+ + Node 20+ for native dev.
Kafka GUI is BYO-Kafka — point it at your own broker via the UI (or the `KAFKAGUI_BOOTSTRAP_SERVERS` env var).

```bash
make up            # docker compose up -d (backend :8080 + frontend :3001)
# — or, native dev with hot reload —
make dev           # backend (:8080) + frontend (:3000) in parallel
```

## Workflow

- Branch off `main`. Use conventional commits: `feat(scope): summary`, `fix(scope): summary`, `docs:`, `test:`, `chore:`.
- Run `make test` before opening a PR.
- The CI workflow at `.github/workflows/ci.yml` runs `mvn verify` and the frontend lint/test/build on every PR.

## Code style

- Backend: Java 21 records for DTOs; Lombok only where it earns its keep. Package-by-feature.
- Frontend: Tailwind, shadcn-style components, TanStack Query for server state, TanStack Table for tables. Types in `lib/types/kafka.ts` mirror backend DTOs verbatim.

## Tests

- Backend: Testcontainers integration tests (`*IT.java`) under `backend/src/test/java/`. Run with `mvn verify`.
- Frontend: Vitest + RTL (`*.test.tsx`). Playwright smoke spec at `frontend/e2e/smoke.spec.ts`.

## Structure

See `ARCHITECTURE.md`.
