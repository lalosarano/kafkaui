"use client";

import { Plus, Send, Trash2, X } from "lucide-react";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogBody, DialogCloseIcon, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { messagesApi } from "@/lib/api/messages";
import { topicsApi } from "@/lib/api/topics";
import { fmt } from "@/lib/format";
import { toast } from "./toast";

export const produceModalEvents = new EventTarget();

export function ProduceModalMount() {
  const [open, setOpen] = React.useState(false);
  const [defaultTopic, setDefaultTopic] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ topic?: string }>).detail ?? {};
      setDefaultTopic(detail.topic ?? null);
      setOpen(true);
    };
    produceModalEvents.addEventListener("open", onOpen as EventListener);
    return () => produceModalEvents.removeEventListener("open", onOpen as EventListener);
  }, []);

  return <ProduceModal open={open} onOpenChange={setOpen} defaultTopic={defaultTopic} />;
}

export function ProduceModal({
  open, onOpenChange, defaultTopic,
}: { open: boolean; onOpenChange: (o: boolean) => void; defaultTopic: string | null }) {
  const qc = useQueryClient();
  const topicsQ = useQuery({
    queryKey: ["topics-for-produce"],
    queryFn: () => topicsApi.list(undefined, false, 0, 500),
    enabled: open,
  });

  const [topic, setTopic] = React.useState("");
  const [partition, setPartition] = React.useState<string>("auto");
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState(`{"hello":"world"}`);
  const [headers, setHeaders] = React.useState<{ k: string; v: string }[]>([{ k: "content-type", v: "application/json" }]);

  React.useEffect(() => {
    if (open) {
      setTopic(defaultTopic ?? topicsQ.data?.content?.[0]?.name ?? "");
      setPartition("auto");
    }
  }, [open, defaultTopic, topicsQ.data]);

  const produceMut = useMutation({
    mutationFn: () =>
      messagesApi.produce(topic, {
        key: key || null,
        value,
        headers: Object.fromEntries(headers.filter((h) => h.k).map((h) => [h.k, h.v])),
        partition: partition === "auto" ? null : Number(partition),
      }),
    onSuccess: (res) => {
      onOpenChange(false);
      toast({
        tone: "success",
        msg: (
          <>
            Produced to <span className="font-mono">{res.topic}</span> · partition {res.partition} · offset{" "}
            <span className="font-mono">{fmt.numFull(res.offset)}</span>
          </>
        ),
      });
      qc.invalidateQueries({ queryKey: ["messages", topic] });
    },
    onError: (err: unknown) => {
      toast({ tone: "error", msg: err instanceof Error ? err.message : "Produce failed" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-2 bg-accent-soft text-accent">
            <Send className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <DialogTitle>Produce message</DialogTitle>
            <DialogDescription>Send a single message. Producing here uses your client credentials and respects ACLs.</DialogDescription>
          </div>
          <DialogCloseIcon />
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Topic <span className="text-red">*</span></label>
                <Select className="font-mono" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {topicsQ.data?.content?.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Partition</label>
                <Select value={partition} onChange={(e) => setPartition(e.target.value)} className="font-mono">
                  <option value="auto">Auto (key-hashed)</option>
                  {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i}>Partition {i}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Key</label>
              <Input className="font-mono" value={key} onChange={(e) => setKey(e.target.value)} placeholder="leave blank for null" />
              <div className="mt-1 text-[11.5px] text-fg-3">Determines partition assignment when set to auto.</div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Value</label>
              <Textarea className="min-h-[180px] font-mono text-[12px]" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-[11.5px] font-medium text-fg-2">Headers</label>
              <div className="flex flex-col gap-1">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input className="font-mono" placeholder="key" value={h.k} onChange={(e) => {
                      const nh = [...headers]; nh[i] = { ...nh[i], k: e.target.value }; setHeaders(nh);
                    }} />
                    <Input className="flex-[2] font-mono" placeholder="value" value={h.v} onChange={(e) => {
                      const nh = [...headers]; nh[i] = { ...nh[i], v: e.target.value }; setHeaders(nh);
                    }} />
                    <Button variant="ghost" size="icon-sm" aria-label="Remove header" onClick={() => setHeaders(headers.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="self-start" onClick={() => setHeaders([...headers, { k: "", v: "" }])}>
                  <Plus className="h-3 w-3" /> Add header
                </Button>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" className="mr-auto" disabled>{/* STUB: copy as kcat — tracked in FOLLOWUPS */}Copy as kcat</Button>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => produceMut.mutate()} disabled={!topic || !value || produceMut.isPending}>
            <Send className="h-3 w-3" /> Produce
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
