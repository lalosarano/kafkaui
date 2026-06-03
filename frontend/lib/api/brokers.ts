import { api } from "./client";
import type { Broker, TopicConfigEntry } from "@/lib/types/kafka";

// Broker configs reuse the same shape as topic configs (name/value/source/readOnly/sensitive).
export type BrokerConfigEntry = TopicConfigEntry;

export const brokersApi = {
  list: () => api<Broker[]>("/brokers"),
  configs: (id: number) => api<BrokerConfigEntry[]>(`/brokers/${id}/configs`),
  updateConfigs: (id: number, configs: Record<string, string>) =>
    api<BrokerConfigEntry[]>(`/brokers/${id}/configs`, {
      method: "PUT",
      body: configs,
    }),
};
