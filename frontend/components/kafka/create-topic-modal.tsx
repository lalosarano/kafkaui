"use client";

import { Info, Plus } from "lucide-react";
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

  React.useEffect(() => {
    if (open) { setName(""); setPartitions(6); setRf(1); setCleanup("delete"); setRetentionN(7); setRetentionUnit("days"); setCompression("producer"); }
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
              Topics are append-only, partitioned logs. Configure replication and retention up front — these are hard to change later.
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
