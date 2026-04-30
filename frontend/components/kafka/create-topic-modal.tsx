"use client";

import { ChevronDown, ChevronRight, Info, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogCloseIcon, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { topicsApi } from "@/lib/api/topics";
import { toast } from "./toast";

const COMMON_KEYS = [
  "min.insync.replicas",
  "max.message.bytes",
  "segment.ms",
  "segment.bytes",
  "retention.bytes",
  "delete.retention.ms",
  "unclean.leader.election.enable",
  "message.timestamp.type",
  "max.compaction.lag.ms",
  "min.compaction.lag.ms",
];

type CustomConfig = { key: string; value: string };

export function CreateTopicModal({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [partitions, setPartitions] = React.useState(6);
  const [rf, setRf] = React.useState(1);
  const [cleanup, setCleanup] = React.useState("delete");
  const [retentionN, setRetentionN] = React.useState(7);
  const [retentionUnit, setRetentionUnit] = React.useState("days");
  const [compression, setCompression] = React.useState("producer");
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [customs, setCustoms] = React.useState<CustomConfig[]>([]);

  React.useEffect(() => {
    if (open) {
      setName("");
      setPartitions(6);
      setRf(1);
      setCleanup("delete");
      setRetentionN(7);
      setRetentionUnit("days");
      setCompression("producer");
      setAdvancedOpen(false);
      setCustoms([]);
    }
  }, [open]);

  const createMut = useMutation({
    mutationFn: () => {
      const retentionMs = retentionUnit === "ms" ? retentionN
        : retentionUnit === "hours" ? retentionN * 3600_000
        : retentionN * 86400_000;
      const configs: Record<string, string> = {
        "cleanup.policy": cleanup,
        "retention.ms": String(retentionMs),
      };
      if (compression !== "producer") configs["compression.type"] = compression;
      for (const c of customs) {
        const k = c.key.trim();
        if (k) configs[k] = c.value;
      }
      return topicsApi.create({ name, partitions, replicationFactor: rf, configs });
    },
    onSuccess: () => {
      onOpenChange(false);
      toast({ tone: "success", msg: <>Topic <span className="font-mono">{name}</span> created</> });
      qc.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (err: unknown) => {
      toast({ tone: "error", msg: err instanceof Error ? err.message : "Create failed" });
    },
  });

  function setCustom(i: number, patch: Partial<CustomConfig>) {
    setCustoms((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-2 bg-accent-soft text-accent">
            <Plus className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <DialogTitle>Create topic</DialogTitle>
            <DialogDescription>
              Topics are append-only, partitioned logs. Replication and partition count are hard to change later.
            </DialogDescription>
          </div>
          <DialogCloseIcon />
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">
                Topic name <span className="text-red">*</span>
              </label>
              <Input className="font-mono" placeholder="orders.events.v1" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="mt-1 text-[11.5px] text-fg-3">
                Lowercase, dot-separated. <span className="font-mono">domain.entity.version</span> is the convention.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Partitions</label>
                <Input type="number" className="font-mono" value={partitions} onChange={(e) => setPartitions(+e.target.value)} min={1} />
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Replication factor</label>
                <Input type="number" className="font-mono" value={rf} onChange={(e) => setRf(+e.target.value)} min={1} />
                <div className="mt-1 text-[11.5px] text-fg-3">3 recommended for prod.</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Cleanup policy</label>
                <Select value={cleanup} onChange={(e) => setCleanup(e.target.value)}>
                  <option value="delete">delete</option>
                  <option value="compact">compact</option>
                  <option value="compact,delete">compact,delete</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Retention</label>
                <div className="flex">
                  <Input type="number" className="rounded-r-none border-r-0 font-mono" value={retentionN} onChange={(e) => setRetentionN(+e.target.value)} />
                  <Select className="w-24 rounded-l-none" value={retentionUnit} onChange={(e) => setRetentionUnit(e.target.value)}>
                    <option value="days">days</option>
                    <option value="hours">hours</option>
                    <option value="ms">ms</option>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Compression</label>
              <Select value={compression} onChange={(e) => setCompression(e.target.value)}>
                <option value="producer">producer (default)</option>
                <option value="zstd">zstd</option>
                <option value="snappy">snappy</option>
                <option value="lz4">lz4</option>
                <option value="gzip">gzip</option>
              </Select>
            </div>

            <div className="rounded-2 border border-border bg-bg-2">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-[12px] font-medium text-fg-2 hover:text-fg"
                onClick={() => setAdvancedOpen((v) => !v)}
              >
                {advancedOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Advanced configs
                <span className="text-[11px] font-normal text-fg-3">
                  ({customs.filter((c) => c.key.trim()).length} set)
                </span>
              </button>
              {advancedOpen && (
                <div className="border-t border-border p-2.5">
                  <div className="mb-2 text-[11.5px] text-fg-3">
                    Add any topic-level config (e.g. <span className="font-mono">min.insync.replicas</span>,{" "}
                    <span className="font-mono">max.message.bytes</span>). Anything you don&apos;t set here will use broker defaults
                    and you can change them later from the topic&apos;s Configuration tab.
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {customs.map((c, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input
                          className="font-mono"
                          placeholder="config.key"
                          value={c.key}
                          onChange={(e) => setCustom(i, { key: e.target.value })}
                          list="topic-config-keys"
                        />
                        <Input
                          className="flex-[2] font-mono"
                          placeholder="value"
                          value={c.value}
                          onChange={(e) => setCustom(i, { value: e.target.value })}
                        />
                        <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => setCustoms(customs.filter((_, j) => j !== i))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-start"
                      onClick={() => setCustoms([...customs, { key: "", value: "" }])}
                    >
                      <Plus className="h-3 w-3" /> Add config
                    </Button>
                  </div>
                  <datalist id="topic-config-keys">
                    {COMMON_KEYS.map((k) => <option key={k} value={k} />)}
                  </datalist>
                </div>
              )}
            </div>

            <div className="rounded-2 border border-border bg-bg-2 p-2.5 text-[12px] text-fg-3">
              <div className="mb-1 flex items-center gap-1.5 text-fg-2"><Info className="h-3 w-3" /> Estimated storage</div>
              ~<span className="font-mono text-fg">{(partitions * rf * 0.5).toFixed(1)} GB</span> at peak retention with 1KB messages at 1k msg/s
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!name || createMut.isPending} onClick={() => createMut.mutate()}>
            <Plus className="h-3 w-3" /> Create topic
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
