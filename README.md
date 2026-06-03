# Kafka GUI

A web-based administration console for Apache Kafka. Topics, consumer groups, schemas, ACLs, brokers, live message tailing — all in one console.

![status](https://img.shields.io/badge/status-v0.1.0-blue)

## Stack

- **Backend** Java 21 · Spring Boot 3.2 · Kafka AdminClient · STOMP WebSocket
- **Frontend** Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · TanStack Query/Table
- **Packaging** docker-compose: backend + frontend in two containers, BYO Kafka

## Quick start

The only prerequisite is **Docker + Docker Compose**:

```bash
docker compose up        # first run builds images (~2 min), then starts
docker compose up -d     # detached
```

- Frontend: <http://localhost:3001>
- Backend API: <http://localhost:8080>

The first time the UI opens, click **Add cluster** and point it at your Kafka. Connection settings, including schema-registry URL and security/SASL, live per cluster — switch between clusters via the topbar. All configuration is persisted in the `kafkagui-data` Docker volume.

To skip that first step, seed a cluster up front: copy `.env.example` to `.env` and set `KAFKAGUI_BOOTSTRAP_SERVERS` (compose reads `.env` automatically), or run `KAFKAGUI_BOOTSTRAP_SERVERS=host.docker.internal:9092 docker compose up`.

Stop everything:

```bash
docker compose down       # keep persisted configs
docker compose down -v    # wipe configs as well
```

## Connecting to Kafka

The backend container reaches your broker via the host network. Common cases:

| Where is Kafka? | bootstrap.servers value |
|---|---|
| On your laptop (Docker Desktop) | `host.docker.internal:9092` |
| On your LAN | `192.168.x.x:9092` (the host's LAN IP) |
| Remote cluster with public DNS | `broker.example.com:9092` |
| Remote cluster with **internal-only** hostnames | configure a **Host alias** (see below) |

### Host aliases

If your brokers advertise hostnames your container can't resolve (e.g. `kafka-broker-1.internal`), open **Settings → Host aliases** in the UI and add `hostname → IP` rows. The backend installs a JVM-wide `InetAddressResolverProvider` that overrides DNS for those names — same effect as editing `/etc/hosts`, but managed in the GUI and persisted across restarts.

Changes take effect on the next Kafka client reconnect (up to ~30 s due to the JVM DNS cache).

## Configuration

Everything sensitive lives in cluster configs (in the UI). Only a handful of env vars are exposed on the compose service:

| Env var | What it does | Default |
|---|---|---|
| `KAFKAGUI_BOOTSTRAP_SERVERS` | Optional: seeds a "default" cluster on first boot. Leave empty to start with no clusters. | (empty) |
| `KAFKAGUI_CORS_ALLOWED_ORIGINS` | Comma-separated browser origins allowed to call the API | `http://localhost:3000,http://localhost:3001` |

Frontend uses two compile-time vars (already wired in compose):

```
NEXT_PUBLIC_API_BASE=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## Code changes

Edit code, then rebuild and restart the affected service:

```bash
docker compose up -d --build backend     # after Java changes
docker compose up -d --build frontend    # after TS/TSX changes
```

## Running natively (without Docker)

Requires Java 21+, Maven 3.9+, Node 20+. Pair with your own Kafka.

```bash
# Backend
cd backend && mvn spring-boot:run

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Documentation

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — backend modules, REST/WS contract, storage strategy
- [`DECISIONS.md`](DECISIONS.md) — log of non-trivial choices
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — workflow

## License

Apache-2.0 — see [LICENSE](LICENSE).
