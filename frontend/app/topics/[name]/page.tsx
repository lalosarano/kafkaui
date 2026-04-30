"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Copy, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { ConfirmModal } from "@/components/kafka/confirm-modal";
import { ErrorState } from "@/components/kafka/error-state";
import { MessageBrowser } from "@/components/kafka/message-browser";
import { PageHeader } from "@/components/kafka/page-header";
import { produceModalEvents } from "@/components/kafka/produce-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicConfigsTab } from "@/components/kafka/topic-configs-tab";
import { topicsApi } from "@/lib/api/topics";
import { fmt } from "@/lib/format";
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

