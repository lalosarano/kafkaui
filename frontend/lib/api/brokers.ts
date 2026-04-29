import { api } from "./client";
import type { Broker } from "@/lib/types/kafka";

export const brokersApi = {
  list: () => api<Broker[]>("/brokers"),
};
