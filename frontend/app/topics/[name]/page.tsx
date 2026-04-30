"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Copy, Pause, Play, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardSub, CardTitle } from "@/components/ui/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { ConfirmModal } from "@/components/kafka/confirm-modal";
import { ErrorState } from "@/components/kafka/error-state";
import { JsonViewer } from "@/components/kafka/json-viewer";
import { LagIndicator } from "@/components/kafka/lag-indicator";
import { PageHeader } from "@/components/kafka/page-header";
import { produceModalEvents } from "@/components/kafka/produce-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/kafka/status-badge";
import { TopicConfigsTab } from "@/components/kafka/topic-configs-tab";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { messagesApi } from "@/lib/api/messages";
import { topicsApi } from "@/lib/api/topics";
import { fmt } from "@/lib/format";
import type { Message } from "@/lib/types/kafka";
import { useLiveTail } from "@/lib/stomp/use-tail";
import { toast } from "@/components/kafka/toast";

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const name = decodeURIComponent(params.name as string);
  const [tab, setTab] = React.useState("messages");
  const [confirmDel, setConfirmDel] = React.useState(false);

  const detailQ = useQuery({
    queryKey: ["topic", name],
    queryFn: () => topicsApi.get(name),
  });

  const deleteMut = useMutation({
    mutationFn: () => topicsApi.delete(name),
    onSuccess: () => {
      toast({ tone: "success", msg: <>Topic <span className="font-mono">{name}</span> deleted</> });
      qc.invalidateQueries({ queryKey: ["topics"] });
      router.push("/topics");
    },
    onError: (err: unknown) => toast({ tone: "error", msg: err instanceof Error ? err.message : "Delete failed" }),
  });

  if (detailQ.isLoading) {
    return (
      <div className="max-w-[1600px] p-5 pb-20">
        <Skeleton className="mb-2 h-6 w-1/3" />
        <Skeleton className="mb-6 h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (detailQ.error) return <div className="p-5"><ErrorState error={detailQ.error} /></div>;
  const detail = detailQ.data!;
  const totalMessages = detail.partitions.reduce((s, p) => s + Math.max(0, p.endOffset - p.beginOffset), 0);
  const cleanup = detail.configs.find((c) => c.name === "cleanup.policy")?.value ?? "delete";
  const retentionMs = +(detail.configs.find((c) => c.name === "retention.ms")?.value ?? "0");

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title={
          <span className="font-mono text-[18px]">{name}</span>
        }
        sub={
          <div className="flex flex-wrap gap-3.5">
            <span><span className="text-fg-3">Partitions</span> <span className="font-mono tabular-nums">{detail.partitions.length}</span></span>
            <span><span className="text-fg-3">RF</span> <span className="font-mono tabular-nums">{detail.replicationFactor}</span></span>
            <span><span className="text-fg-3">Messages</span> <span className="font-mono tabular-nums">{fmt.numFull(totalMessages)}</span></span>
            <span><span className="text-fg-3">Retention</span> <span className="font-mono tabular-nums">{fmt.ms(retentionMs)}</span></span>
            <span><span className="text-fg-3">Policy</span> <span className="font-mono">{cleanup}</span></span>
          </div>
        }
        actions={
          <>
            <Button variant="default" onClick={() => navigator.clipboard.writeText(name)}>
              <Copy className="h-3 w-3" /> Copy name
            </Button>
            <Button variant="primary" onClick={() => produceModalEvents.dispatchEvent(new CustomEvent("open", { detail: { topic: name } }))}>
              <Send className="h-3 w-3" /> Produce
            </Button>
            <Button variant="danger" onClick={() => setConfirmDel(true)}>
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </>
        }
      />
      <div className="mb-2 text-[12px] text-fg-3">
        <Link href="/topics" className="inline-flex items-center gap-1 hover:text-fg-2"><ChevronLeft className="h-3 w-3" /> All topics</Link>
        {detail.internal && <Badge tone="violet" className="ml-2 align-middle">internal</Badge>}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="partitions">Partitions ({detail.partitions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Partition leadership</CardTitle></CardHeader>
            <div className="grid gap-1.5 p-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))" }}>
              {detail.partitions.map((p) => (
                <div
                  key={p.partition}
                  title={`Partition ${p.partition} → leader ${p.leader}`}
                  className={`rounded-1 border px-1.5 py-1.5 text-center font-mono text-[10.5px] ${p.isr.length < p.replicas.length ? "border-amber/40 bg-amber-bg text-amber" : "border-border bg-bg-2 text-fg-2"}`}
                >
                  P{p.partition}
                  <div className="mt-1 text-[9px] text-fg-4">{p.leader}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <MessageBrowser topicName={name} partitionCount={detail.partitions.length} />
        </TabsContent>

        <TabsContent value="config">
          <TopicConfigsTab topicName={name} />
        </TabsContent>

        <TabsContent value="partitions">
          <div className="overflow-hidden rounded-3 border border-border bg-surface">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                  <th className="px-3 py-1.5 text-right">P</th>
                  <th className="px-3 py-1.5 text-right">Leader</th>
                  <th className="px-3 py-1.5 text-left">Replicas</th>
                  <th className="px-3 py-1.5 text-left">ISR</th>
                  <th className="px-3 py-1.5 text-right">Begin offset</th>
                  <th className="px-3 py-1.5 text-right">End offset</th>
                  <th className="px-3 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {detail.partitions.map((p) => {
                  const urp = p.isr.length < p.replicas.length;
                  return (
                    <tr key={p.partition} className="border-b border-border-soft last:border-b-0">
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">P{p.partition}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{p.leader ?? "—"}</td>
                      <td className="px-3 py-1.5 font-mono">[{p.replicas.join(",")}]</td>
                      <td className="px-3 py-1.5 font-mono"><span className={urp ? "text-amber" : ""}>[{p.isr.join(",")}]</span></td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg-3">{fmt.numFull(p.beginOffset)}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt.numFull(p.endOffset)}</td>
                      <td className="px-3 py-1.5">{urp ? <Badge tone="amber">URP</Badge> : <Badge tone="green" dot>OK</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Delete topic"
        description={<>This will permanently delete <span className="font-mono">{name}</span> and all messages across <span className="font-mono">{detail.partitions.length}</span> partitions. <strong>This cannot be undone.</strong></>}
        confirmLabel="Delete topic"
        confirmText={name}
        onConfirm={() => deleteMut.mutateAsync()}
      />
    </div>
  );
}

function MessageBrowser({ topicName, partitionCount }: { topicName: string; partitionCount: number }) {
  const [paused, setPaused] = React.useState(false);
  const [tail, setTail] = React.useState(true);
  const [partition, setPartition] = React.useState<string>("all");
  const [filter, setFilter] = React.useState("");
  const [selected, setSelected] = React.useState<Message | null>(null);

  const histQ = useQuery({
    queryKey: ["messages", topicName, partition],
    queryFn: () => messagesApi.fetch(topicName, { partition: partition === "all" ? undefined : Number(partition), limit: 50 }),
    enabled: !tail,
  });

  const liveTail = useLiveTail(tail ? topicName : null, tail, paused);
  const messages = tail ? liveTail.messages : (histQ.data ?? []);

  const filtered = messages.filter((m) => {
    if (partition !== "all" && m.partition !== Number(partition)) return false;
    if (filter && JSON.stringify(m.value).toLowerCase().indexOf(filter.toLowerCase()) === -1 && (m.key ?? "").indexOf(filter) === -1) return false;
    return true;
  });

  return (
    <div className={`grid gap-3.5 ${selected ? "[grid-template-columns:1fr_480px] max-[1100px]:grid-cols-1" : "grid-cols-1"}`}>
      <div className="overflow-hidden rounded-3 border border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border bg-bg-2 px-3 py-2.5">
          <Button size="sm" variant={paused ? "primary" : "default"} onClick={() => setPaused((p) => !p)}>
            {paused ? <><Play className="h-3 w-3" /> Resume</> : <><Pause className="h-3 w-3" /> Pause</>}
          </Button>
          <label className="flex items-center gap-1.5 text-[12px]">
            <Switch checked={tail} onChange={(e) => setTail(e.target.checked)} aria-label="Live tail" />
            Live tail
            {tail && <span className="ml-1 inline-block h-1.5 w-1.5 animate-soft-pulse rounded-full bg-green" />}
          </label>
          <div className="h-4 w-px bg-border" />
          <Select className="h-6 w-32" value={partition} onChange={(e) => setPartition(e.target.value)}>
            <option value="all">All partitions</option>
            {Array.from({ length: partitionCount }).map((_, i) => <option key={i} value={i}>Partition {i}</option>)}
          </Select>
          <Input className="h-6 w-60" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by key, value…" aria-label="Filter messages" />
          <div className="flex-1" />
          <span className="font-mono text-[12px] text-fg-3">{filtered.length} msgs</span>
        </div>
        <div className="max-h-[560px] overflow-y-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                <th className="px-3 py-1.5 text-left">P</th>
                <th className="px-3 py-1.5 text-left">Offset</th>
                <th className="px-3 py-1.5 text-left">Timestamp</th>
                <th className="px-3 py-1.5 text-left">Key</th>
                <th className="px-3 py-1.5 text-left">Value</th>
                <th className="px-3 py-1.5 text-right">Size</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, idx) => (
                <tr
                  key={m.partition + ":" + m.offset + ":" + idx}
                  data-active={selected?.offset === m.offset && selected?.partition === m.partition}
                  className="cursor-pointer border-b border-border-soft hover:bg-bg-hover data-[active=true]:bg-bg-active"
                  onClick={() => setSelected(m)}
                >
                  <td className="px-3 py-1.5 font-mono tabular-nums text-fg-3">P{m.partition}</td>
                  <td className="px-3 py-1.5 font-mono tabular-nums">{fmt.numFull(m.offset)}</td>
                  <td className="px-3 py-1.5 font-mono text-fg-3">{fmt.time(m.timestamp)}</td>
                  <td className="max-w-[140px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1.5 font-mono text-accent">{m.key ?? "—"}</td>
                  <td className="max-w-[360px] overflow-hidden text-ellipsis whitespace-nowrap px-3 py-1.5 font-mono text-fg-2">
                    {typeof m.value === "string" ? m.value : JSON.stringify(m.value)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg-3">{m.sizeBytes}B</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-12 text-center text-fg-3">{tail ? "Waiting for messages…" : "No messages"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Message detail</CardTitle>
              <CardSub className="font-mono">P{selected.partition} · offset {fmt.numFull(selected.offset)}</CardSub>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setSelected(null)}>×</Button>
          </CardHeader>
          <div className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-1.5 border-b border-border p-3.5 text-[12px]">
            <span className="text-fg-3">Timestamp</span><span className="font-mono">{new Date(selected.timestamp).toISOString()}</span>
            <span className="text-fg-3">Key</span><span className="font-mono text-accent">{selected.key ?? "—"}</span>
            <span className="text-fg-3">Format</span><span className="font-mono">{selected.valueFormat}</span>
            <span className="text-fg-3">Size</span><span className="font-mono">{selected.sizeBytes} B</span>
            <span className="text-fg-3">Headers</span>
            <div className="font-mono text-[11.5px]">
              {Object.entries(selected.headers).map(([k, v]) => (
                <div key={k}><span className="text-fg-3">{k}:</span> {v}</div>
              ))}
            </div>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <JsonViewer data={selected.value as object} />
          </div>
        </Card>
      )}
    </div>
  );
}
