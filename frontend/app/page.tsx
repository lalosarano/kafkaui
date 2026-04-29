"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, RefreshCcw, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { brokersApi } from "@/lib/api/brokers";
import { clusterApi } from "@/lib/api/cluster";
import { ErrorState } from "@/components/kafka/error-state";
import { KpiRow, KpiTile } from "@/components/kafka/kpi";
import { PageHeader } from "@/components/kafka/page-header";
import { StatusBadge } from "@/components/kafka/status-badge";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/format";
import { produceModalEvents } from "@/components/kafka/produce-modal";

export default function DashboardPage() {
  const cluster = useQuery({ queryKey: ["cluster"], queryFn: clusterApi.current, refetchInterval: 30_000 });
  const brokers = useQuery({ queryKey: ["brokers"], queryFn: brokersApi.list, refetchInterval: 30_000 });

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title={
          <span>
            {cluster.data?.clusterId ?? "kafka-cluster"}{" "}
            {cluster.data && (
              <Badge tone="green" dot className="ml-2 align-middle">Healthy</Badge>
            )}
          </span>
        }
        sub={cluster.data ? `${cluster.data.kafkaVersion} · ${cluster.data.brokerCount} brokers · controller ` : "loading…"}
        actions={
          <>
            <Button variant="default" onClick={() => { cluster.refetch(); brokers.refetch(); }}>
              <RefreshCcw className="h-3 w-3" /> Refresh
            </Button>
            <Button variant="primary" onClick={() => produceModalEvents.dispatchEvent(new CustomEvent("open", { detail: {} }))}>
              <Send className="h-3 w-3" /> Produce message
            </Button>
          </>
        }
      />

      {cluster.error ? <ErrorState error={cluster.error} /> : null}

      <KpiRow className="mb-3.5">
        <KpiTile label="Brokers" value={cluster.data?.brokerCount ?? <Skeleton className="h-6 w-12" />} sub="online" />
        <KpiTile label="Topics" value={cluster.data?.totalTopics ?? <Skeleton className="h-6 w-12" />} />
        <KpiTile label="Partitions" value={cluster.data?.totalPartitions ?? <Skeleton className="h-6 w-12" />} />
        <KpiTile label="Under-replicated" value={cluster.data?.underReplicatedPartitions ?? "—"} tone={cluster.data && cluster.data.underReplicatedPartitions > 0 ? "amber" : undefined} />
        <KpiTile label="Offline partitions" value={cluster.data?.offlinePartitions ?? "—"} tone={cluster.data && cluster.data.offlinePartitions > 0 ? "red" : "green"} />
        <KpiTile label="Active controller" value={cluster.data?.controllerId ?? "—"} sub={cluster.data ? <span className="font-mono">broker {cluster.data.controllerId}</span> : null} />
      </KpiRow>

      <div className="grid grid-cols-[1.6fr_1fr] gap-3.5 mb-3.5 max-[900px]:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Brokers</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/brokers">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          {brokers.isLoading ? (
            <div className="p-3.5"><Skeleton className="h-32" /></div>
          ) : brokers.error ? (
            <div className="p-3.5"><ErrorState error={brokers.error} /></div>
          ) : (
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                  <th className="px-3 py-1.5 text-left">ID</th>
                  <th className="px-3 py-1.5 text-left">Host</th>
                  <th className="px-3 py-1.5 text-left">Rack</th>
                  <th className="px-3 py-1.5 text-left">Role</th>
                  <th className="px-3 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {brokers.data?.map((b) => (
                  <tr key={b.id} className="border-b border-border-soft last:border-b-0">
                    <td className="px-3 py-1.5 font-mono">{b.id}</td>
                    <td className="px-3 py-1.5 font-mono text-fg-2">{b.host}:{b.port}</td>
                    <td className="px-3 py-1.5 font-mono text-fg-3">{b.rack ?? "—"}</td>
                    <td className="px-3 py-1.5">{b.isController ? <Badge tone="accent">controller</Badge> : <span className="text-fg-3">broker</span>}</td>
                    <td className="px-3 py-1.5"><StatusBadge state="healthy" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cluster summary</CardTitle>
          </CardHeader>
          <div className="p-3.5">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[12.5px]">
              <span className="text-fg-3">Cluster ID</span>
              <span className="font-mono">{cluster.data?.clusterId ?? "—"}</span>
              <span className="text-fg-3">Version</span>
              <span className="font-mono">{cluster.data?.kafkaVersion ?? "—"}</span>
              <span className="text-fg-3">Topics</span>
              <span className="font-mono tabular-nums">{fmt.num(cluster.data?.totalTopics ?? 0)}</span>
              <span className="text-fg-3">Partitions</span>
              <span className="font-mono tabular-nums">{fmt.num(cluster.data?.totalPartitions ?? 0)}</span>
              <span className="text-fg-3">Brokers</span>
              <span className="font-mono tabular-nums">{cluster.data?.brokerCount ?? 0}</span>
              <span className="text-fg-3">Controller</span>
              <span className="font-mono">{cluster.data?.controllerId ?? "—"}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
