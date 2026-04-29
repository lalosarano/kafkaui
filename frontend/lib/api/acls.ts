import { api } from "./client";
import type { Acl, CreateAclRequest } from "@/lib/types/kafka";

export const aclsApi = {
  list: (filter: { principal?: string; resourceType?: string; resourceName?: string } = {}) =>
    api<Acl[]>("/acls", { query: filter }),
  create: (req: CreateAclRequest) => api<Acl>("/acls", { method: "POST", body: req }),
  delete: (filter: { principal?: string; resourceType?: string; resourceName?: string; operation?: string }) =>
    api<{ deleted: number }>("/acls", { method: "DELETE", query: filter }),
};
