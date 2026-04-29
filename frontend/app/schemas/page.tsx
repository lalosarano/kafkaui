"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardSub, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/kafka/error-state";
import { Input } from "@/components/ui/input";
import { JsonViewer } from "@/components/kafka/json-viewer";
import { PageHeader } from "@/components/kafka/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { schemasApi } from "@/lib/api/schemas";
import { ApiCallError } from "@/lib/api/client";

export default function SchemasPage() {
  const [q, setQ] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);

  const subjectsQ = useQuery({ queryKey: ["schema-subjects"], queryFn: schemasApi.subjects });
  const detailQ = useQuery({
    queryKey: ["schema-latest", selected],
    queryFn: () => schemasApi.latest(selected!),
    enabled: !!selected,
  });

  if (subjectsQ.error instanceof ApiCallError && subjectsQ.error.status === 503) {
    return (
      <div className="max-w-[1600px] p-5 pb-20">
        <PageHeader title="Schemas" sub="No Schema Registry configured" />
        <Card>
          <div className="p-8 text-center text-fg-3">
            <h4 className="m-0 mb-1 text-[14px] font-semibold text-fg">Schema Registry not configured</h4>
            <p className="m-0 max-w-md text-[12.5px]">
              Set <span className="font-mono">kafka-gui.schema-registry.url</span> in <span className="font-mono">application.yml</span> (or the env var <span className="font-mono">KAFKAGUI_SCHEMA_REGISTRY_URL</span>) and restart the backend.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const filtered = (subjectsQ.data ?? []).filter((s) => s.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader title="Schemas" sub={`${subjectsQ.data?.length ?? 0} subjects in registry`} />
      {subjectsQ.error && <ErrorState error={subjectsQ.error} />}

      <div className={`grid gap-3.5 ${selected ? "[grid-template-columns:1fr_1.4fr] max-[1100px]:grid-cols-1" : "grid-cols-1"}`}>
        <div className="overflow-hidden rounded-3 border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border bg-bg-2 px-3 py-2.5">
            <Input className="w-72" placeholder="Search subjects…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="flex-1" />
            <span className="text-[12px] text-fg-3">{filtered.length} subjects</span>
          </div>
          {subjectsQ.isLoading ? (
            <div className="p-3.5"><Skeleton className="h-32" /></div>
          ) : (
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                  <th className="px-3 py-1.5 text-left">Subject</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s}
                    data-active={selected === s}
                    className="cursor-pointer border-b border-border-soft last:border-b-0 hover:bg-bg-hover data-[active=true]:bg-bg-active"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-3 py-1.5 font-mono text-fg">{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <Card>
            <CardHeader>
              <div className="min-w-0">
                <CardTitle className="font-mono text-[13px]">{selected}</CardTitle>
                {detailQ.data && (
                  <CardSub className="flex items-center gap-2.5">
                    <Badge tone="accent">v{detailQ.data.version} latest</Badge>
                    <span><span className="text-fg-3">Type</span> <span className="font-mono">{detailQ.data.schemaType}</span></span>
                    <span><span className="text-fg-3">Compatibility</span> <span className="font-mono">{detailQ.data.compatibility}</span></span>
                  </CardSub>
                )}
              </div>
            </CardHeader>
            {detailQ.isLoading && <div className="p-3.5"><Skeleton className="h-48" /></div>}
            {detailQ.error && <div className="p-3.5"><ErrorState error={detailQ.error} /></div>}
            {detailQ.data && (
              <div className="max-h-[480px] overflow-auto">
                <JsonViewer data={tryParse(detailQ.data.schema)} />
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function tryParse(s: string): unknown {
  try { return JSON.parse(s); } catch { return { raw: s }; }
}
