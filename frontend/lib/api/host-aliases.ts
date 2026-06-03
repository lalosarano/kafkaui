import { api } from "./client";
import type { HostAlias } from "@/lib/types/kafka";

export const hostAliasesApi = {
  list: () => api<HostAlias[]>("/host-aliases"),
  replace: (entries: HostAlias[]) =>
    api<HostAlias[]>("/host-aliases", { method: "PUT", body: entries }),
};
