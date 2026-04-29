"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogCloseIcon, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { consumerGroupsApi } from "@/lib/api/consumer-groups";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

const STRATEGIES = [
  ["earliest", "Earliest", "Re-consume all messages from the start of the topic"],
  ["latest", "Latest", "Skip to the end — drop all unconsumed messages"],
  ["timestamp", "By timestamp", "Reset to a specific point in time"],
  ["offset", "Specific offset", "Reset to a manually-entered offset"],
] as const;

export function ResetOffsetsModal({
  open, onOpenChange, groupId, topic,
}: { open: boolean; onOpenChange: (o: boolean) => void; groupId: string; topic: string | null }) {
  const qc = useQueryClient();
  const [strategy, setStrategy] = React.useState<typeof STRATEGIES[number][0]>("earliest");
  const [value, setValue] = React.useState<number>(0);
  const [confirmText, setConfirmText] = React.useState("");

  React.useEffect(() => { if (open) { setStrategy("earliest"); setValue(0); setConfirmText(""); } }, [open]);
  const required = `RESET ${groupId}`;
  const ok = confirmText === required && (strategy !== "offset" || !Number.isNaN(value));

  const resetMut = useMutation({
    mutationFn: () => consumerGroupsApi.resetOffsets(groupId, {
      strategy,
      topic: topic ?? "",
      value: strategy === "offset" ? value : undefined,
    }),
    onSuccess: () => {
      onOpenChange(false);
      toast({ tone: "success", msg: <>Offsets reset for <span className="font-mono">{groupId}</span></> });
      qc.invalidateQueries({ queryKey: ["consumer-group", groupId] });
    },
    onError: (err: unknown) => toast({ tone: "error", msg: err instanceof Error ? err.message : "Reset failed" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-2 bg-red-bg text-red">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <DialogTitle>Reset offsets for {groupId}</DialogTitle>
            <DialogDescription>
              Resetting offsets will cause this group to re-process or skip messages. Members must be paused or stopped first.
            </DialogDescription>
          </div>
          <DialogCloseIcon />
        </DialogHeader>
        <DialogBody>
          <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Reset strategy</label>
          <div className="flex flex-col gap-1.5">
            {STRATEGIES.map(([v, l, d]) => (
              <label
                key={v}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-2 border border-border p-2.5",
                  strategy === v && "border-accent bg-accent-soft",
                )}
              >
                <input type="radio" className="mt-0.5" checked={strategy === v} onChange={() => setStrategy(v)} />
                <div>
                  <div className="text-[13px] font-medium">{l}</div>
                  <div className="mt-0.5 text-[11.5px] text-fg-3">{d}</div>
                </div>
              </label>
            ))}
          </div>
          {strategy === "offset" && (
            <div className="mt-3.5">
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Target offset</label>
              <Input type="number" className="font-mono" value={value} onChange={(e) => setValue(+e.target.value)} />
            </div>
          )}
          <div className="mt-3.5 rounded-2 border border-amber/40 bg-amber-bg p-2.5 text-[12px] text-amber">
            Type <span className="font-mono">{required}</span> below to confirm.
          </div>
          <Input className="mt-2 font-mono" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={required} />
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!ok || resetMut.isPending} onClick={() => resetMut.mutate()}>
            <RotateCcw className="h-3 w-3" /> Reset offsets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
