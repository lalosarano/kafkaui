import { api } from "./client";
import type { SchemaVersion } from "@/lib/types/kafka";

export const schemasApi = {
  subjects: () => api<string[]>("/schemas/subjects"),
  versions: (subject: string) =>
    api<number[]>(`/schemas/subjects/${encodeURIComponent(subject)}/versions`),
  latest: (subject: string) =>
    api<SchemaVersion>(`/schemas/subjects/${encodeURIComponent(subject)}/versions/latest`),
  version: (subject: string, version: number) =>
    api<SchemaVersion>(`/schemas/subjects/${encodeURIComponent(subject)}/versions/${version}`),
  checkCompatibility: (subject: string, schema: string, schemaType: string = "AVRO") =>
    api<{ isCompatible: boolean; messages: string[] }>(
      `/schemas/subjects/${encodeURIComponent(subject)}/compatibility`,
      { method: "POST", body: { schema, schemaType } },
    ),
};
