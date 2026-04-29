// Mirrors backend DTOs verbatim. Keep in sync with com.kafkagui.*.dto.

export type ClusterConfig = {
  id: string;
  name: string;
  color: string | null;
  bootstrapServers: string;
  securityProtocol: string | null;
  saslMechanism: string | null;
  saslJaasConfig: string | null;
  sslTruststoreLocation: string | null;
  sslTruststorePassword: string | null;
  schemaRegistryUrl: string | null;
};

export type ClusterTestResult = {
  ok: boolean;
  error: string | null;
  message: string | null;
  brokerCount: number | null;
  controllerId: number | null;
  clusterId: string | null;
  latencyMs: number | null;
};

export type ApiError = {
  error: string;
  message: string;
  details?: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type ClusterInfo = {
  clusterId: string;
  controllerId: number | null;
  brokerCount: number;
  kafkaVersion: string;
  totalTopics: number;
  totalPartitions: number;
  underReplicatedPartitions: number;
  offlinePartitions: number;
};

export type Broker = {
  id: number;
  host: string;
  port: number;
  rack: string | null;
  isController: boolean;
};

export type Topic = {
  name: string;
  partitions: number;
  replicationFactor: number;
  internal: boolean;
};

export type Partition = {
  partition: number;
  leader: number | null;
  replicas: number[];
  isr: number[];
  beginOffset: number;
  endOffset: number;
};

export type TopicConfigEntry = {
  name: string;
  value: string | null;
  source: string;
  readOnly: boolean;
  sensitive: boolean;
};

export type TopicDetail = {
  name: string;
  internal: boolean;
  replicationFactor: number;
  partitions: Partition[];
  configs: TopicConfigEntry[];
};

export type CreateTopicRequest = {
  name: string;
  partitions: number;
  replicationFactor: number;
  configs?: Record<string, string>;
};

export type Message = {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  key: string | null;
  value: unknown;
  valueFormat: "json" | "text" | "base64" | "avro" | "protobuf" | "null";
  schemaId: number | null;
  sizeBytes: number;
  headers: Record<string, string>;
};

export type ProduceRequest = {
  key?: string | null;
  value: string;
  headers?: Record<string, string>;
  partition?: number | null;
};

export type ProduceResult = {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
};

export type ConsumerGroupSummary = {
  id: string;
  state: "stable" | "rebalancing" | "empty" | "dead" | "preparingrebalance" | "completingrebalance" | string;
  members: number;
  totalLag: number;
  protocol: string | null;
  coordinator: number | null;
};

export type ConsumerGroupMember = {
  memberId: string;
  clientId: string;
  host: string;
  assignments: string[];
};

export type PartitionAssignment = {
  topic: string;
  partition: number;
  currentOffset: number | null;
  endOffset: number | null;
  lag: number;
  memberId: string | null;
  host: string | null;
};

export type ConsumerGroupDetail = {
  id: string;
  state: string;
  protocol: string | null;
  coordinator: number | null;
  totalLag: number;
  members: ConsumerGroupMember[];
  assignments: PartitionAssignment[];
};

export type ResetOffsetsRequest = {
  strategy: "earliest" | "latest" | "timestamp" | "offset";
  value?: number;
  topic: string;
  partitions?: number[];
};

export type ResetOffsetsResult = {
  groupId: string;
  topic: string;
  partitionOffsets: Record<number, number>;
};

export type SchemaVersion = {
  subject: string;
  id: number;
  version: number;
  schema: string;
  schemaType: "AVRO" | "JSON" | "PROTOBUF" | string;
  compatibility: string;
};

export type Acl = {
  principal: string;
  host: string;
  resourceType: string;
  resourceName: string;
  patternType: string;
  operation: string;
  permissionType: "ALLOW" | "DENY" | string;
};

export type CreateAclRequest = {
  principal: string;
  host?: string;
  resourceType: string;
  resourceName: string;
  patternType: string;
  operation: string;
  permissionType: "ALLOW" | "DENY";
};

export type LagSnapshot = {
  groupId: string;
  totalLag: number;
  partitions: { topic: string; partition: number; lag: number }[];
  ts: number;
};
