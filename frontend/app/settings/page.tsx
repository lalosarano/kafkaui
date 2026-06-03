"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/kafka/page-header";
import { toast } from "@/components/kafka/toast";
import { hostAliasesApi } from "@/lib/api/host-aliases";
import type { HostAlias } from "@/lib/types/kafka";

const HOSTNAME_RE = /^[A-Za-z0-9._-]{1,253}$/;
const IP_LITERAL_RE = /^[0-9a-fA-F.:]{2,45}$/;

type Row = HostAlias & { _key: string };

let rowSeq = 0;
const blankRow = (): Row => ({ _key: `r${++rowSeq}`, hostname: "", ip: "" });

export default function SettingsPage() {
  const qc = useQueryClient();
  const aliasesQ = useQuery({
    queryKey: ["host-aliases"],
    queryFn: () => hostAliasesApi.list(),
  });

  const [rows, setRows] = React.useState<Row[]>([]);
  const [baseline, setBaseline] = React.useState<HostAlias[]>([]);

  React.useEffect(() => {
    if (!aliasesQ.data) return;
    setBaseline(aliasesQ.data);
    setRows(aliasesQ.data.map((a) => ({ ...a, _key: `r${++rowSeq}` })));
  }, [aliasesQ.data]);

  const errors = rows.map((r) => validate(r));
  const anyError = errors.some(Boolean);
  const dirty = isDirty(rows, baseline);

  const saveMut = useMutation({
    mutationFn: () => hostAliasesApi.replace(rows.map(({ _key, ...rest }) => rest)),
    onSuccess: (saved) => {
      setBaseline(saved);
      setRows(saved.map((a) => ({ ...a, _key: `r${++rowSeq}` })));
      qc.invalidateQueries({ queryKey: ["host-aliases"] });
      toast({ tone: "success", msg: <>Host aliases saved — Kafka clients will rebuild on next request</> });
    },
    onError: (err: unknown) =>
      toast({ tone: "error", msg: err instanceof Error ? err.message : "Save failed" }),
  });

  const update = (idx: number, patch: Partial<HostAlias>) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) => setRows((rs) => rs.filter((_, i) => i !== idx));
  const add = () => setRows((rs) => [...rs, blankRow()]);
  const reset = () => setRows(baseline.map((a) => ({ ...a, _key: `r${++rowSeq}` })));

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader title="Settings" sub="Connection and preferences" />

      <Card className="mb-3.5">
        <CardHeader><CardTitle>Connection</CardTitle></CardHeader>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 p-3.5 text-[12.5px]">
          <span className="text-fg-3">API base</span>
          <span className="font-mono">{process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080/api/v1"}</span>
          <span className="text-fg-3">WebSocket</span>
          <span className="font-mono">{process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws"}</span>
        </div>
      </Card>

      <Card className="mb-3.5">
        <CardHeader>
          <CardTitle>Host aliases</CardTitle>
        </CardHeader>
        <div className="p-3.5">
          <p className="mb-3 text-[12px] text-fg-3">
            Override hostname → IP resolution inside the backend JVM. Useful when a broker
            advertises an internal hostname (e.g. <span className="font-mono">kafka-broker-1.internal</span>) that
            your machine cannot resolve. Same effect as editing <span className="font-mono">/etc/hosts</span>,
            but scoped to this application. Changes take effect on the next Kafka client reconnect
            (up to ~30s due to the JVM DNS cache).
          </p>

          {aliasesQ.isLoading ? (
            <div className="text-[12px] text-fg-3">Loading…</div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_1fr_28px] gap-x-2 gap-y-1.5 items-start">
                <div className="text-[11px] uppercase tracking-wide text-fg-4">Hostname</div>
                <div className="text-[11px] uppercase tracking-wide text-fg-4">IP address</div>
                <div />
                {rows.length === 0 ? (
                  <div className="col-span-3 py-3 text-[12px] text-fg-3">No aliases configured.</div>
                ) : (
                  rows.map((r, i) => (
                    <React.Fragment key={r._key}>
                      <div>
                        <Input
                          value={r.hostname}
                          placeholder="kafka-broker-1.internal"
                          onChange={(e) => update(i, { hostname: e.target.value })}
                          className="font-mono"
                        />
                        {errors[i]?.hostname && (
                          <div className="mt-1 text-[11px] text-red">{errors[i]!.hostname}</div>
                        )}
                      </div>
                      <div>
                        <Input
                          value={r.ip}
                          placeholder="10.0.0.42"
                          onChange={(e) => update(i, { ip: e.target.value })}
                          className="font-mono"
                        />
                        {errors[i]?.ip && (
                          <div className="mt-1 text-[11px] text-red">{errors[i]!.ip}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(i)}
                        aria-label={`Remove alias ${r.hostname || i + 1}`}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </React.Fragment>
                  ))
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button variant="default" size="sm" onClick={add}>
                  <Plus size={14} /> Add alias
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  {dirty && (
                    <Button variant="ghost" size="sm" onClick={reset} disabled={saveMut.isPending}>
                      Discard
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => saveMut.mutate()}
                    disabled={!dirty || anyError || saveMut.isPending}
                  >
                    {saveMut.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>

              {conflictWarning(rows)}
            </>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
        <div className="p-3.5 text-[12px] text-fg-3">Use the theme toggle in the topbar to switch between light and dark mode.</div>
      </Card>
    </div>
  );
}

function validate(r: HostAlias): { hostname?: string; ip?: string } | null {
  const out: { hostname?: string; ip?: string } = {};
  if (!r.hostname.trim()) out.hostname = "Required";
  else if (!HOSTNAME_RE.test(r.hostname)) out.hostname = "Invalid hostname";
  if (!r.ip.trim()) out.ip = "Required";
  else if (!IP_LITERAL_RE.test(r.ip)) out.ip = "Must be a numeric IPv4 or IPv6";
  return Object.keys(out).length ? out : null;
}

function isDirty(rows: Row[], baseline: HostAlias[]): boolean {
  if (rows.length !== baseline.length) return true;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].hostname !== baseline[i].hostname || rows[i].ip !== baseline[i].ip) return true;
  }
  return false;
}

function conflictWarning(rows: Row[]): React.ReactNode {
  const byHost = new Map<string, Set<string>>();
  for (const r of rows) {
    const h = r.hostname.trim().toLowerCase();
    if (!h || !r.ip.trim()) continue;
    if (!byHost.has(h)) byHost.set(h, new Set());
    byHost.get(h)!.add(r.ip.trim());
  }
  const multi = [...byHost.entries()].filter(([, ips]) => ips.size > 1);
  if (multi.length === 0) return null;
  return (
    <div className="mt-3 rounded-2 border border-amber-bg bg-amber-bg/40 p-2 text-[11.5px] text-amber">
      {multi.map(([h, ips]) => (
        <div key={h}>
          <span className="font-mono">{h}</span> maps to {ips.size} IPs ({[...ips].join(", ")}) — the resolver will return all of them, round-robin.
        </div>
      ))}
    </div>
  );
}
