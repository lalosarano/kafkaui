// data.jsx — fake but believable Kafka cluster data

const NOW = Date.now();

const TOPICS = [
  { name: "orders.events.v3", partitions: 24, rf: 3, msgs: 1284932103, size: 482.4, retentionMs: 604800000, throughput: 12400, lag: 0, status: "healthy", config: { cleanup: "delete", compression: "zstd" }, owner: "checkout-team" },
  { name: "payments.transactions", partitions: 32, rf: 3, msgs: 982103442, size: 712.1, retentionMs: 1209600000, throughput: 8200, lag: 12, status: "healthy", config: { cleanup: "delete", compression: "snappy" }, owner: "payments-platform" },
  { name: "users.signup", partitions: 6, rf: 3, msgs: 14823091, size: 3.2, retentionMs: 2592000000, throughput: 120, lag: 0, status: "healthy", config: { cleanup: "compact", compression: "lz4" }, owner: "growth" },
  { name: "telemetry.events.raw", partitions: 64, rf: 2, msgs: 18421032894, size: 4823.1, retentionMs: 86400000, throughput: 142000, lag: 184302, status: "warning", config: { cleanup: "delete", compression: "zstd" }, owner: "data-platform" },
  { name: "telemetry.events.enriched", partitions: 64, rf: 3, msgs: 9210391023, size: 6213.4, retentionMs: 604800000, throughput: 138000, lag: 240, status: "healthy", config: { cleanup: "delete", compression: "zstd" }, owner: "data-platform" },
  { name: "audit.security.v2", partitions: 12, rf: 3, msgs: 482103, size: 12.4, retentionMs: 31536000000, throughput: 24, lag: 0, status: "healthy", config: { cleanup: "compact,delete", compression: "gzip" }, owner: "security" },
  { name: "inventory.snapshots", partitions: 16, rf: 3, msgs: 3812931, size: 184.3, retentionMs: -1, throughput: 410, lag: 0, status: "healthy", config: { cleanup: "compact", compression: "snappy" }, owner: "inventory" },
  { name: "shipping.tracking.live", partitions: 24, rf: 3, msgs: 218492103, size: 124.8, retentionMs: 259200000, throughput: 4200, lag: 0, status: "healthy", config: { cleanup: "delete", compression: "lz4" }, owner: "logistics" },
  { name: "notifications.outbox", partitions: 8, rf: 3, msgs: 1248203, size: 8.4, retentionMs: 86400000, throughput: 320, lag: 0, status: "healthy", config: { cleanup: "delete", compression: "snappy" }, owner: "platform" },
  { name: "search.index.updates", partitions: 12, rf: 2, msgs: 91283012, size: 412.0, retentionMs: 1209600000, throughput: 1840, lag: 8421, status: "warning", config: { cleanup: "delete", compression: "zstd" }, owner: "search" },
  { name: "ml.feature.store", partitions: 32, rf: 3, msgs: 4821031, size: 2840.1, retentionMs: -1, throughput: 80, lag: 0, status: "healthy", config: { cleanup: "compact", compression: "zstd" }, owner: "ml-platform" },
  { name: "fraud.signals.v4", partitions: 16, rf: 3, msgs: 18402103, size: 84.2, retentionMs: 2592000000, throughput: 920, lag: 4, status: "healthy", config: { cleanup: "delete", compression: "snappy" }, owner: "fraud" },
  { name: "support.tickets.events", partitions: 4, rf: 3, msgs: 821042, size: 6.1, retentionMs: 7776000000, throughput: 18, lag: 0, status: "healthy", config: { cleanup: "delete", compression: "lz4" }, owner: "support" },
  { name: "_consumer_offsets", partitions: 50, rf: 3, msgs: 0, size: 8.4, retentionMs: -1, throughput: 0, lag: 0, status: "internal", system: true, config: { cleanup: "compact" }, owner: "kafka" },
  { name: "__transaction_state", partitions: 50, rf: 3, msgs: 0, size: 1.2, retentionMs: -1, throughput: 0, lag: 0, status: "internal", system: true, config: { cleanup: "compact" }, owner: "kafka" },
  { name: "billing.invoices.v2", partitions: 8, rf: 3, msgs: 184201, size: 1.4, retentionMs: -1, throughput: 4, lag: 0, status: "healthy", config: { cleanup: "compact" }, owner: "billing" },
  { name: "catalog.product.changes", partitions: 12, rf: 3, msgs: 4820103, size: 24.0, retentionMs: 604800000, throughput: 220, lag: 0, status: "healthy", config: { cleanup: "compact,delete" }, owner: "catalog" },
  { name: "experiments.exposures", partitions: 24, rf: 2, msgs: 192384012, size: 184.0, retentionMs: 1209600000, throughput: 3200, lag: 0, status: "healthy", config: { cleanup: "delete" }, owner: "experimentation" },
];

const BROKERS = [
  { id: 1001, host: "kfk-broker-01.use1.prod", rack: "use1-az1", role: "controller", status: "healthy", disk: 62, cpu: 42, partitions: 184, leaders: 92, network: 124 },
  { id: 1002, host: "kfk-broker-02.use1.prod", rack: "use1-az1", role: "broker", status: "healthy", disk: 58, cpu: 38, partitions: 182, leaders: 88, network: 118 },
  { id: 1003, host: "kfk-broker-03.use1.prod", rack: "use1-az2", role: "broker", status: "healthy", disk: 64, cpu: 44, partitions: 186, leaders: 94, network: 130 },
  { id: 1004, host: "kfk-broker-04.use1.prod", rack: "use1-az2", role: "broker", status: "warning", disk: 84, cpu: 71, partitions: 190, leaders: 96, network: 142 },
  { id: 1005, host: "kfk-broker-05.use1.prod", rack: "use1-az3", role: "broker", status: "healthy", disk: 56, cpu: 36, partitions: 180, leaders: 86, network: 116 },
  { id: 1006, host: "kfk-broker-06.use1.prod", rack: "use1-az3", role: "broker", status: "healthy", disk: 60, cpu: 40, partitions: 184, leaders: 90, network: 122 },
];

const CONSUMER_GROUPS = [
  { id: "checkout-order-processor", state: "stable", members: 8, topic: "orders.events.v3", lag: 124, lagPct: 0.0001, coordinator: 1001, protocol: "range" },
  { id: "payments-settlement", state: "stable", members: 4, topic: "payments.transactions", lag: 12, lagPct: 0, coordinator: 1003, protocol: "cooperative-sticky" },
  { id: "telemetry-aggregator-v2", state: "rebalancing", members: 16, topic: "telemetry.events.raw", lag: 184302, lagPct: 0.012, coordinator: 1002, protocol: "cooperative-sticky" },
  { id: "search-indexer", state: "stable", members: 6, topic: "search.index.updates", lag: 8421, lagPct: 0.002, coordinator: 1005, protocol: "range" },
  { id: "fraud-scorer", state: "stable", members: 8, topic: "fraud.signals.v4", lag: 4, lagPct: 0, coordinator: 1004, protocol: "cooperative-sticky" },
  { id: "shipping-live-tracker", state: "stable", members: 12, topic: "shipping.tracking.live", lag: 0, lagPct: 0, coordinator: 1006, protocol: "range" },
  { id: "ml-feature-pipeline", state: "stable", members: 4, topic: "ml.feature.store", lag: 0, lagPct: 0, coordinator: 1001, protocol: "cooperative-sticky" },
  { id: "experiments-rollup", state: "empty", members: 0, topic: "experiments.exposures", lag: 0, lagPct: 0, coordinator: 1003, protocol: "range" },
  { id: "audit-archiver-legacy", state: "dead", members: 0, topic: "audit.security.v2", lag: 1842032, lagPct: 0.84, coordinator: 1002, protocol: "range" },
  { id: "notifications-dispatcher", state: "stable", members: 3, topic: "notifications.outbox", lag: 12, lagPct: 0, coordinator: 1004, protocol: "cooperative-sticky" },
  { id: "inventory-snapshot-loader", state: "stable", members: 2, topic: "inventory.snapshots", lag: 0, lagPct: 0, coordinator: 1005, protocol: "range" },
  { id: "billing-invoicer", state: "stable", members: 1, topic: "billing.invoices.v2", lag: 0, lagPct: 0, coordinator: 1001, protocol: "range" },
];

const SCHEMAS = [
  { subject: "orders.events.v3-value", versions: 4, latestVersion: 4, type: "AVRO", compatibility: "BACKWARD", lastChanged: "2 days ago" },
  { subject: "orders.events.v3-key", versions: 1, latestVersion: 1, type: "AVRO", compatibility: "BACKWARD", lastChanged: "8 months ago" },
  { subject: "payments.transactions-value", versions: 7, latestVersion: 7, type: "PROTOBUF", compatibility: "FULL_TRANSITIVE", lastChanged: "5 hours ago" },
  { subject: "payments.transactions-key", versions: 1, latestVersion: 1, type: "AVRO", compatibility: "BACKWARD", lastChanged: "1 year ago" },
  { subject: "users.signup-value", versions: 3, latestVersion: 3, type: "AVRO", compatibility: "BACKWARD", lastChanged: "3 weeks ago" },
  { subject: "telemetry.events.raw-value", versions: 12, latestVersion: 12, type: "AVRO", compatibility: "BACKWARD_TRANSITIVE", lastChanged: "1 day ago" },
  { subject: "telemetry.events.enriched-value", versions: 8, latestVersion: 8, type: "AVRO", compatibility: "BACKWARD", lastChanged: "1 day ago" },
  { subject: "fraud.signals.v4-value", versions: 5, latestVersion: 5, type: "PROTOBUF", compatibility: "FULL", lastChanged: "1 week ago" },
  { subject: "audit.security.v2-value", versions: 2, latestVersion: 2, type: "JSON", compatibility: "FORWARD", lastChanged: "4 months ago" },
  { subject: "inventory.snapshots-value", versions: 6, latestVersion: 6, type: "AVRO", compatibility: "BACKWARD", lastChanged: "2 weeks ago" },
  { subject: "shipping.tracking.live-value", versions: 3, latestVersion: 3, type: "PROTOBUF", compatibility: "BACKWARD", lastChanged: "1 month ago" },
  { subject: "ml.feature.store-value", versions: 14, latestVersion: 14, type: "AVRO", compatibility: "NONE", lastChanged: "3 days ago" },
];

const ACLS = [
  { principal: "User:checkout-svc", resource: "Topic:orders.events.v3", op: "Read,Write", perm: "Allow", host: "*", pattern: "Literal" },
  { principal: "User:payment-svc", resource: "Topic:payments.transactions", op: "Read,Write", perm: "Allow", host: "*", pattern: "Literal" },
  { principal: "User:payment-svc", resource: "Group:payments-*", op: "Read", perm: "Allow", host: "*", pattern: "Prefixed" },
  { principal: "User:telemetry-collector", resource: "Topic:telemetry.*", op: "Write", perm: "Allow", host: "10.0.0.0/8", pattern: "Prefixed" },
  { principal: "User:data-pipeline", resource: "Topic:telemetry.*", op: "Read", perm: "Allow", host: "*", pattern: "Prefixed" },
  { principal: "User:fraud-scorer", resource: "Topic:fraud.signals.v4", op: "Read,Write", perm: "Allow", host: "*", pattern: "Literal" },
  { principal: "User:legacy-archiver", resource: "Topic:audit.*", op: "Read", perm: "Deny", host: "*", pattern: "Prefixed" },
  { principal: "User:admin-readonly", resource: "Cluster:kafka-cluster", op: "Describe", perm: "Allow", host: "*", pattern: "Literal" },
  { principal: "User:platform-ops", resource: "Cluster:kafka-cluster", op: "All", perm: "Allow", host: "10.0.0.0/8", pattern: "Literal" },
  { principal: "User:search-svc", resource: "Topic:search.*", op: "Read,Write", perm: "Allow", host: "*", pattern: "Prefixed" },
];

// generate fake messages for a topic
function makeMessages(topicName, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const offset = 4821030400 + i;
    const partition = Math.floor(Math.random() * 24);
    const tsOffset = Math.floor(Math.random() * 4000);
    out.push({
      offset,
      partition,
      ts: NOW - i * 1200 - tsOffset,
      key: `usr_${(Math.random().toString(36).slice(2, 10))}`,
      headers: { "x-trace-id": Math.random().toString(36).slice(2, 18), "content-type": "application/avro" },
      value: {
        order_id: `ord_${Math.random().toString(36).slice(2, 12)}`,
        user_id: `usr_${Math.random().toString(36).slice(2, 10)}`,
        items: Math.floor(Math.random() * 8) + 1,
        total_cents: Math.floor(Math.random() * 20000) + 500,
        currency: ["USD", "EUR", "GBP"][Math.floor(Math.random() * 3)],
        status: ["pending", "confirmed", "shipped"][Math.floor(Math.random() * 3)],
        ts: NOW - i * 1200,
      },
      size: 480 + Math.floor(Math.random() * 200),
    });
  }
  return out;
}

const ALERTS = [
  { sev: "warning", title: "Under-replicated partitions", body: "telemetry.events.raw — 3 partitions URP on broker 1004", ts: "12m ago", resource: "telemetry.events.raw" },
  { sev: "warning", title: "High disk usage", body: "kfk-broker-04 at 84% — recommend rebalance", ts: "28m ago", resource: "kfk-broker-04" },
  { sev: "error", title: "Consumer group dead", body: "audit-archiver-legacy has not heartbeat in 6h", ts: "1h ago", resource: "audit-archiver-legacy" },
  { sev: "warning", title: "Schema compatibility broken", body: "ml.feature.store-value compatibility=NONE", ts: "3h ago", resource: "ml.feature.store-value" },
  { sev: "info", title: "Rebalance complete", body: "telemetry-aggregator-v2 — 16 members, 64 partitions", ts: "4h ago", resource: "telemetry-aggregator-v2" },
];

// schemas content
const SCHEMA_CONTENT_AVRO = {
  type: "record",
  name: "OrderEvent",
  namespace: "com.acme.orders",
  fields: [
    { name: "order_id", type: "string" },
    { name: "user_id", type: "string" },
    { name: "items", type: "int" },
    { name: "total_cents", type: "long" },
    { name: "currency", type: { type: "enum", name: "Currency", symbols: ["USD", "EUR", "GBP"] } },
    { name: "status", type: ["null", "string"], default: null },
    { name: "ts", type: { type: "long", logicalType: "timestamp-millis" } }
  ]
};

window.KAFKA_DATA = { TOPICS, BROKERS, CONSUMER_GROUPS, SCHEMAS, ACLS, ALERTS, makeMessages, SCHEMA_CONTENT_AVRO };
