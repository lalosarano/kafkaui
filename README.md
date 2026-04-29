# Kafka GUI

A web-based administration console for Apache Kafka. Topics, consumer groups, schemas, ACLs, brokers, live message tailing — all in one console.

![status](https://img.shields.io/badge/status-v0.1.0-blue)

## Stack

- **Backend** Java 21 · Spring Boot 3.2 · Kafka AdminClient · STOMP WebSocket
- **Frontend** Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · TanStack Query/Table
- **Local infra** docker-compose with single-broker Kafka (KRaft mode) + Schema Registry

## Prerequisites

- Java 21+ (`java -version` should show 21)
- Maven 3.9+
- Node 20+ and npm 10+
- Docker + Docker Compose

## Quick start

```bash
# 1. spin up Kafka + Schema Registry in docker
make kafka-up

# 2. run backend + frontend in parallel
make dev
```

- Backend: <http://localhost:8080>
- Frontend: <http://localhost:3000>
- Kafka bootstrap: `localhost:9092`
- Schema Registry: <http://localhost:8081>

Stop everything: `make kafka-down`.

## Configuration

Backend reads `backend/src/main/resources/application.yml` and env vars:

| Property | Env | Default |
|---|---|---|
| `kafka-gui.bootstrap-servers` | `KAFKAGUI_BOOTSTRAP_SERVERS` | `localhost:9092` |
| `kafka-gui.security-protocol` | `KAFKAGUI_SECURITY_PROTOCOL` | `PLAINTEXT` |
| `kafka-gui.sasl-mechanism` | `KAFKAGUI_SASL_MECHANISM` | (unset) |
| `kafka-gui.schema-registry.url` | `KAFKAGUI_SCHEMA_REGISTRY_URL` | `http://localhost:8081` |
| `kafka-gui.cors.allowed-origins` | `KAFKAGUI_CORS_ALLOWED_ORIGINS` | `http://localhost:3000` |

Frontend reads `frontend/.env.local`:

```
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## Make targets

| Target | What it does |
|---|---|
| `make kafka-up` | docker compose up -d |
| `make kafka-down` | docker compose down |
| `make dev` | backend + frontend together |
| `make test` | mvn verify (backend) + npm test (frontend) |
| `make build` | mvn package + next build |
| `make clean` | wipe `target/` and `.next/` |

## Documentation

- [`PLAN.md`](PLAN.md) — endpoint map, route map, package layout
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — backend modules, REST/WS contract, storage strategy
- [`CLAUDE.md`](CLAUDE.md) — context for future sessions (you're probably one of them)
- [`HANDOFF.md`](HANDOFF.md) — what works / what's stubbed / how to resume
- [`FOLLOWUPS.md`](FOLLOWUPS.md) — backlog
- [`DECISIONS.md`](DECISIONS.md) — log of non-trivial choices
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — workflow

## License

MIT — see [LICENSE](LICENSE) (unset; mark as TBD).
