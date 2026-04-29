"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus, Server, XCircle } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogCloseIcon, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { setActiveClusterId } from "@/lib/active-cluster";
import { clusterConfigsApi } from "@/lib/api/cluster-configs";
import type { ClusterConfig, ClusterTestResult } from "@/lib/types/kafka";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

const SECURITY_PROTOCOLS = ["PLAINTEXT", "SSL", "SASL_PLAINTEXT", "SASL_SSL"];
const SASL_MECHANISMS = ["", "PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512", "OAUTHBEARER"];
const COLORS = ["#7c9cff", "#7be0a4", "#ffd166", "#ff8c8c", "#c084fc", "#22d3ee", "#fb923c"];

export function AddClusterModal({
  open, onOpenChange, initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<ClusterConfig>;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState<Partial<ClusterConfig>>(blank());
  const [testResult, setTestResult] = React.useState<ClusterTestResult | null>(null);
  const [tested, setTested] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDraft(initial ? { ...blank(), ...initial } : blank());
      setTestResult(null);
      setTested(false);
    }
  }, [open, initial]);

  const testMut = useMutation({
    mutationFn: () => clusterConfigsApi.test(draft),
    onSuccess: (res) => { setTestResult(res); setTested(true); },
    onError: (err: unknown) =>
      setTestResult({ ok: false, error: "request-failed", message: err instanceof Error ? err.message : "Unknown error", brokerCount: null, controllerId: null, clusterId: null, latencyMs: null }),
  });

  const saveMut = useMutation({
    mutationFn: () => clusterConfigsApi.create(draft),
    onSuccess: (saved) => {
      onOpenChange(false);
      toast({ tone: "success", msg: <>Cluster <span className="font-mono">{saved.name}</span> added</> });
      qc.invalidateQueries({ queryKey: ["cluster-configs"] });
      setActiveClusterId(saved.id);
      // reload so all queries pick up the new cluster id
      setTimeout(() => window.location.reload(), 250);
    },
    onError: (err: unknown) => toast({ tone: "error", msg: err instanceof Error ? err.message : "Save failed" }),
  });

  function update<K extends keyof ClusterConfig>(key: K, value: ClusterConfig[K] | null) {
    setDraft((d) => ({ ...d, [key]: value }));
    setTested(false);
  }

  const canTest = !!draft.bootstrapServers?.trim();
  const canSave = tested && testResult?.ok && !!draft.name?.trim() && !!draft.bootstrapServers?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-2 bg-accent-soft text-accent">
            <Server className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <DialogTitle>Add Kafka cluster</DialogTitle>
            <DialogDescription>
              Connection details are stored on the backend in <span className="font-mono">/data/clusters.json</span>. Test the connection before saving.
            </DialogDescription>
          </div>
          <DialogCloseIcon />
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Display name <span className="text-red">*</span></label>
                <Input value={draft.name ?? ""} onChange={(e) => update("name", e.target.value)} placeholder="prod-use1" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Color</label>
                <div className="flex h-7 items-center gap-1.5 rounded-2 border border-border bg-surface px-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update("color", c)}
                      className={cn(
                        "h-4 w-4 rounded-full ring-offset-1 ring-offset-bg",
                        draft.color === c && "ring-2 ring-fg",
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Bootstrap servers <span className="text-red">*</span></label>
              <Input className="font-mono" value={draft.bootstrapServers ?? ""} onChange={(e) => update("bootstrapServers", e.target.value)} placeholder="b-1.use1.kafka:9094, b-2.use1.kafka:9094" />
              <div className="mt-1 text-[11.5px] text-fg-3">Comma-separated host:port pairs.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Security protocol</label>
                <Select value={draft.securityProtocol ?? "PLAINTEXT"} onChange={(e) => update("securityProtocol", e.target.value)}>
                  {SECURITY_PROTOCOLS.map((p) => <option key={p}>{p}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">SASL mechanism</label>
                <Select value={draft.saslMechanism ?? ""} onChange={(e) => update("saslMechanism", e.target.value || null)}>
                  {SASL_MECHANISMS.map((m) => <option key={m} value={m}>{m || "(none)"}</option>)}
                </Select>
              </div>
            </div>
            {(draft.saslMechanism ?? "") !== "" && (
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">SASL JAAS config</label>
                <Textarea
                  className="min-h-[60px] font-mono text-[11.5px]"
                  value={draft.saslJaasConfig ?? ""}
                  onChange={(e) => update("saslJaasConfig", e.target.value || null)}
                  placeholder='org.apache.kafka.common.security.scram.ScramLoginModule required username="..." password="...";'
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Schema Registry URL</label>
              <Input className="font-mono" value={draft.schemaRegistryUrl ?? ""} onChange={(e) => update("schemaRegistryUrl", e.target.value || null)} placeholder="https://schema-registry-1.kafka:8081" />
              <div className="mt-1 text-[11.5px] text-fg-3">Optional. Leave blank if you don't use Schema Registry.</div>
            </div>

            <div
              className={cn(
                "rounded-2 border p-2.5 text-[12px]",
                !testResult && "border-border bg-bg-2 text-fg-3",
                testResult?.ok && "border-green/40 bg-green-bg text-green",
                testResult && !testResult.ok && "border-red/40 bg-red-bg text-red",
              )}
            >
              {!testResult && "Click \"Test connection\" to verify the broker is reachable."}
              {testResult?.ok && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <div>
                    Connected to cluster <span className="font-mono">{testResult.clusterId}</span>{" "}
                    · {testResult.brokerCount} broker(s) · controller{" "}
                    <span className="font-mono">{testResult.controllerId}</span>{" "}
                    · <span className="font-mono">{testResult.latencyMs}ms</span>
                  </div>
                </div>
              )}
              {testResult && !testResult.ok && (
                <div className="flex items-start gap-2">
                  <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{testResult.error}</div>
                    <div className="mt-0.5 text-[11.5px] opacity-90">{testResult.message}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" className="mr-auto" onClick={() => testMut.mutate()} disabled={!canTest || testMut.isPending}>
            {testMut.isPending ? "Testing…" : "Test connection"}
          </Button>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            <Plus className="h-3 w-3" /> Add cluster
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function blank(): Partial<ClusterConfig> {
  return {
    id: undefined,
    name: "",
    color: COLORS[0],
    bootstrapServers: "",
    securityProtocol: "PLAINTEXT",
    saslMechanism: "",
    saslJaasConfig: null,
    schemaRegistryUrl: null,
  };
}
