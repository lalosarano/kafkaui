# Kafka GUI — Build Plan

## Project summary

Kafka GUI is a single-page web administration console for an Apache Kafka cluster. The mockups in `.designs/` describe a dark-by-default, slate-neutral interface with a single muted-blue accent (driven by OKLCH tokens in `styles.css`). The shell is a fixed 232px sidebar (cluster picker → main nav: Overview, Topics, Consumer groups, Schemas, ACLs, Brokers, Settings → user footer) plus a 44px topbar (breadcrumbs, cmd+K search, connection-status pill, alerts/help). Seven primary screens cover end-to-end Kafka admin: a dashboard with live KPI tiles + dual-area throughput charts + brokers + alerts + top topics; a topic list with sortable/filterable rows and bulk actions; a topic detail page with six tabs (Overview, Messages with live-tail, Consumers, Configuration, Partitions, ACLs); consumer-groups list + slide-over drawer with reset-offsets modal; schemas list with versions/diff/compatibility; ACLs by-resource/by-principal with create modal; brokers list with disk/CPU/network. Cross-cutting features: a command palette (cmd+K) over routes/topics/groups; type-to-confirm modals for destructive ops; a produce-message modal; toast stack; light/dark theming. The implementation pairs a Spring Boot 3 backend (Kafka AdminClient + Producer/Consumer + Schema Registry client + STOMP WS) with a Next.js 15 App-Router frontend (TanStack Query + TanStack Table + shadcn/ui + Tailwind).

## REST endpoint map (all under `/api/v1`)

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `/clusters/current` | — | `ClusterInfo { clusterId, controllerId, brokerCount, kafkaVersion, totalTopics, totalPartitions, underReplicated, offlinePartitions }` |
| GET | `/brokers` | — | `Broker[] { id, host, port, rack, isController }` |
| GET | `/topics` | `?q=&page=&size=&showInternal=` | `Page<Topic> { content, totalElements, totalPages, page, size }` |
| GET | `/topics/{name}` | — | `TopicDetail` |
| POST | `/topics` | `CreateTopicRequest { name, partitions, replicationFactor, configs? }` | `Topic` |
| DELETE | `/topics/{name}` | — | `204` |
| GET | `/topics/{name}/configs` | — | `TopicConfigEntry[]` |
| PUT | `/topics/{name}/configs` | `Map<String,String>` | `TopicConfigEntry[]` |
| GET | `/topics/{name}/messages` | `?partition=&fromOffset=&limit=&timeoutMs=` | `Message[]` |
| POST | `/topics/{name}/messages` | `ProduceRequest { key?, value, headers?, partition? }` | `ProduceResult { partition, offset, timestamp }` |
| GET | `/consumer-groups` | `?state=&q=` | `ConsumerGroupSummary[]` |
| GET | `/consumer-groups/{id}` | — | `ConsumerGroupDetail { id, state, protocol, members[], assignments[], totalLag }` |
| POST | `/consumer-groups/{id}/reset-offsets` | `ResetOffsetsRequest { strategy: earliest\|latest\|timestamp\|offset, value?, partitions? }` | `ResetOffsetsResult` |
| DELETE | `/consumer-groups/{id}` | — | `204` |
| GET | `/schemas/subjects` | — | `string[]` |
| GET | `/schemas/subjects/{subject}/versions` | — | `int[]` |
| GET | `/schemas/subjects/{subject}/versions/{version}` | — | `SchemaVersion { id, version, schema, schemaType }` |
| POST | `/schemas/subjects/{subject}/compatibility` | `{ schema, schemaType }` | `{ isCompatible }` |
| GET | `/acls` | `?principal=&resourceType=&resourceName=` | `Acl[]` |
| POST | `/acls` | `CreateAclRequest` | `Acl` |
| DELETE | `/acls` | filter body | `204` |

Errors: every controller error returns `{ error: string, message: string, details?: string }` via global `@RestControllerAdvice`. CORS enabled for `http://localhost:3000`.

## WebSocket map (STOMP at `/ws`, SockJS-fallback)

| Topic | Direction | Payload |
|---|---|---|
| `/topic/messages/{topicName}` | server → client | `Message` (live tail) |
| `/topic/lag/{groupId}` | server → client | `{ groupId, totalLag, partitions: [{partition, lag}], ts }` (every 2s) |
| `/app/tail/start` | client → server | `{ topicName, partition?, fromOffset? }` |
| `/app/tail/stop` | client → server | `{ topicName }` |

## Frontend route map (Next.js App Router)

| Route | Mockup |
|---|---|
| `/` | dashboard.jsx · cluster overview |
| `/topics` | topics.jsx · list + create modal |
| `/topics/[name]` | topic-detail.jsx · 6 tabs (default `messages`) |
| `/consumers` | other-pages.jsx · ConsumersPage + drawer |
| `/consumers/[id]` | other-pages.jsx · drawer pre-opened |
| `/schemas` | other-pages.jsx · SchemasPage with detail pane |
| `/acls` | other-pages.jsx · AclsPage + create modal |
| `/brokers` | other-pages.jsx · BrokersPage |
| `/settings` | other-pages.jsx · SettingsPage |

Global overlays (mounted in root layout): produce modal, command palette, toast stack, theme toggle.

## Backend Java package layout

```
com.kafkagui
├── KafkaGuiApplication
├── config            // KafkaAdminConfig, ConsumerFactoryConfig, WsConfig, CorsConfig, SchemaRegistryConfig
├── common
│   ├── dto           // ApiError, PageResponse, etc.
│   └── error         // GlobalExceptionHandler
├── cluster           // ClusterController, ClusterService
├── broker            // BrokerController, BrokerService
├── topic             // TopicController, TopicService, TopicConfigService
├── message           // MessageController, MessageService, MessageDecoder
├── consumer          // ConsumerGroupController, ConsumerGroupService
├── schema            // SchemaController, SchemaService
├── acl               // AclController, AclService
└── ws                // WsConfig, TailController, LagBroadcaster
```

## shadcn primitives to install

`button`, `input`, `select`, `dialog`, `dropdown-menu`, `tabs`, `table`, `badge`, `checkbox`, `switch`, `label`, `tooltip`, `command`, `popover`, `separator`, `skeleton`, `sheet`, `toast`, `radio-group`, `textarea`, `scroll-area`, `progress`.

## Dependencies

### Backend (Maven)
- spring-boot-starter-web 3.2.x
- spring-boot-starter-websocket
- spring-boot-starter-validation
- spring-kafka 3.x (brings AdminClient + Producer + Consumer)
- io.confluent:kafka-schema-registry-client 7.5.x
- io.confluent:kafka-avro-serializer 7.5.x
- org.projectlombok:lombok
- com.fasterxml.jackson.module:jackson-module-parameter-names
- spring-boot-starter-test (test)
- org.testcontainers:kafka, org.testcontainers:junit-jupiter (test)

### Frontend (npm)
- next ^15, react 18, typescript ^5, tailwindcss, autoprefixer, postcss
- @tanstack/react-query, @tanstack/react-table
- @radix-ui/react-* (via shadcn)
- class-variance-authority, clsx, tailwind-merge, tailwindcss-animate
- lucide-react (icon set)
- next-themes
- @stomp/stompjs, sockjs-client
- react-json-view-lite
- cmdk (command palette)
- vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @vitejs/plugin-react
- @playwright/test, @axe-core/playwright

## Open questions resolved (mirrored to DECISIONS.md)

1. **Multi-cluster support?** Single cluster from `application.yml`. Out of scope; `FOLLOWUPS.md` tracks multi-cluster.
2. **Auth?** None in v0.1. CORS open for `localhost:3000`. `FOLLOWUPS.md` tracks auth.
3. **Live tail consumer lifecycle?** Each STOMP subscription gets a unique consumer in a UUID group, `auto.offset.reset=latest`, paused by client toggle. Cleaned up on unsubscribe.
4. **Historical message fetch consumer?** Per-request consumer with manual seek, polled until `limit` or 2s timeout, then closed.
5. **Schema Registry optional?** If unconfigured, `SchemaController` returns `503` with `schema-registry-not-configured` error.
6. **Pagination?** Topics paginated (page/size); brokers/groups/schemas/ACLs returned in full (typically <500 per cluster).
7. **Type-to-confirm string?** Topic name for delete-topic; `RESET <group-id>` for reset-offsets.
8. **WebSocket transport?** STOMP over native WS (`/ws`); SockJS fallback enabled for legacy proxies.
9. **Lombok?** Yes, for DTO records that need builders. Plain `record` types where suitable.
10. **Java version?** Java 21 (per spec); local toolchain has Java 8 only — CI/Docker will use 21. Build cannot be locally verified (logged in `TEST_RESULTS.md`).
