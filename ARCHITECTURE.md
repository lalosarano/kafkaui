# Architecture

```
┌──────────────────┐    REST /api/v1            ┌─────────────────────┐
│                  │◄──────────────────────────►│                     │
│  Next.js (3000)  │    WS /ws (STOMP)          │  Spring Boot (8080) │
│                  │◄──────────────────────────►│                     │
└──────────────────┘                            └────────┬────────────┘
                                                         │  Kafka client (AdminClient,
                                                         │  Producer, Consumer)
                                                         │  + Schema Registry client
                                                         ▼
                                            ┌──────────────────────────┐
                                            │  Kafka 3.7 (KRaft mode)  │
                                            │  Schema Registry 7.5     │
                                            └──────────────────────────┘
```

## Backend modules

`com.kafkagui.config` — `KafkaAdminConfig` (single `AdminClient` bean from `application.yml`), `ConsumerFactoryConfig` (factory for ad-hoc consumers; `auto.offset.reset=none`, manual seek), `ProducerConfig` (default key/value `StringSerializer`, `compression=zstd`), `WsConfig` (STOMP at `/ws`, broker `/topic`, app prefix `/app`), `CorsConfig`, `SchemaRegistryConfig` (optional bean).

`com.kafkagui.cluster` — describes the bound cluster: id, controller, brokers, version (via `AdminClient.describeCluster()` + `describeConfigs(BROKER)` for software version).

`com.kafkagui.broker` — list brokers + per-broker partition counts and rack.

`com.kafkagui.topic` — list/get/create/delete + configs. Uses `AdminClient.listTopics(ListTopicsOptions().listInternal(true))`, `describeTopics`, `describeConfigs(TOPIC)`, `incrementalAlterConfigs`.

`com.kafkagui.message` — `MessageService` opens a per-request `KafkaConsumer<byte[],byte[]>` for historical reads (assign + seek), polls until `limit` or 2s, decodes via `MessageDecoder`. Producer is a singleton bean. **Decoder algorithm**: if first 5 bytes look like Confluent magic byte `0x00` + 4-byte schema id → Avro/Protobuf via Schema Registry; else try UTF-8 valid + JSON.parse → JSON; else UTF-8 → text; else base64.

`com.kafkagui.consumer` — `ConsumerGroupService` lists groups (`listConsumerGroups`), describes (`describeConsumerGroups`), reads offsets (`listConsumerGroupOffsets`), and resets (`alterConsumerGroupOffsets`). Lag = end offset − committed offset per partition.

`com.kafkagui.schema` — talks to Confluent Schema Registry via `CachedSchemaRegistryClient`. If not configured, all endpoints return 503.

`com.kafkagui.acl` — `AdminClient.describeAcls`, `createAcls`, `deleteAcls`. Filterable by principal/resource.

`com.kafkagui.ws` — `TailController` handles `/app/tail/start` and `/app/tail/stop`. `LagBroadcaster` is a `@Scheduled` task running every 2s, broadcasting per-group lag deltas to subscribed clients.

`com.kafkagui.common` — `ApiError`, `PageResponse<T>`, `GlobalExceptionHandler` mapping common Kafka exceptions:

| Kafka exception | HTTP | code |
|---|---|---|
| `UnknownTopicOrPartitionException` | 404 | `topic-not-found` |
| `TopicExistsException` | 409 | `topic-exists` |
| `InvalidPartitionsException`, `InvalidReplicationFactorException` | 400 | `invalid-topic-spec` |
| `GroupIdNotFoundException` | 404 | `group-not-found` |
| `AuthorizationException` | 403 | `forbidden` |
| `TimeoutException` | 504 | `kafka-timeout` |
| `RestClientException` (registry) | 502 | `registry-error` |
| anything else | 500 | `internal-error` |

## REST/WS contract

See the `*Controller` classes under `backend/src/main/java/com/kafkagui/` for the full endpoint and WS topic listing. JSON shapes match `frontend/lib/types/kafka.ts` exactly.

## Auth model (placeholder)

v0.1 has no auth. CORS is open only to `http://localhost:3000`. The intended next step is a thin reverse-proxy header check + an upstream OAuth2/OIDC provider; the backend reads `X-User` for actor logging, but the proxy is responsible for verifying the JWT.

## Connection-config storage strategy

v0.1 stores cluster connection (bootstrap servers, security protocol, SASL config, schema-registry URL) in `application.yml`. There is no UI-driven cluster switcher. When multi-cluster lands, connection configs will live in a `clusters` table (Postgres) and the AdminClient will be an `Map<clusterId, AdminClient>` cache wrapped in a `ClusterRegistry` bean.

## Test strategy

- **Backend** `Testcontainers` (`org.testcontainers:kafka`) for AdminService, TopicService, ConsumerGroupService, MessageService — at least one happy path + one error path per service. Unit-tested where dependencies are pure (decoders, lag math).
- **Frontend** Vitest + React Testing Library for `<DataTable>`, `<StatusBadge>`, type-to-confirm modal, and a screen-level test per major page (with mocked API). Playwright smoke spec: dashboard → topics → topic detail.
- **A11y** `@axe-core/playwright` runs against dashboard and topic detail in CI.

## Performance notes

- Single AdminClient is reused across requests.
- Topic list is small (typically <500); pagination is server-side and uses streaming sort then slice.
- Lag broadcast tick is 2s (configurable) and runs only when at least one client is subscribed.
- Live-tail messages are buffered to 100 per topic per session; client controls retention via pause/resume.
