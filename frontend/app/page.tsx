"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Info, RefreshCcw, Send, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { brokersApi } from "@/lib/api/brokers";
import { clusterApi } from "@/lib/api/cluster";
import { clusterConfigsApi } from "@/lib/api/cluster-configs";
import { getActiveClusterId, subscribeActiveCluster } from "@/lib/active-cluster";
import { alertsApi, metricsApi } from "@/lib/api/metrics";
import { DualAreaChart } from "@/components/kafka/area-chart";
import { ErrorState } from "@/components/kafka/error-state";
import { KpiRow, KpiTile } from "@/components/kafka/kpi";
import { PageHeader } from "@/components/kafka/page-header";
import { Sparkline } from "@/components/kafka/sparkline";
import { StatusBadge } from "@/components/kafka/status-badge";
import { fmt } from "@/lib/format";
import { produceModalEvents } from "@/components/kafka/produce-modal";
import type { Alert } from "@/lib/types/kafka";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  useEffect(() => {
    setActiveClusterId(getActiveClusterId());
    return subscribeActiveCluster(setActiveClusterId);
  }, []);
  const cluster = useQuery({ queryKey: ["cluster"], queryFn: clusterApi.current, refetchInterval: 30_000 });
  const clusterConfigs = useQuery({ queryKey: ["cluster-configs"], queryFn: clusterConfigsApi.list, staleTime: 30_000 });
  const clusterName = clusterConfigs.data?.find((c) => c.id === activeClusterId)?.name;
  const brokers = useQuery({ queryKey: ["brokers"], queryFn: brokersApi.list, refetchInterval: 30_000 });
  const throughput = useQuery({
    queryKey: ["throughput"],
    queryFn: metricsApi.throughput,
    refetchInterval: 5_000,
  });
  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: alertsApi.list,
    refetchInterval: 15_000,
  });

  const msgsIn = throughput.data?.messagesInPerSec ?? [];
  const msgsOut = throughput.data?.messagesOutPerSec ?? [];
  const bytesIn = (throughput.data?.bytesInPerSec ?? []).map((b) => b / 1_048_576);
  const bytesOut = (throughput.data?.bytesOutPerSec ?? []).map((b) => b / 1_048_576);
  const lastIn = msgsIn[msgsIn.length - 1] ?? 0;
  const lastOut = msgsOut[msgsOut.length - 1] ?? 0;
  const lastBin = bytesIn[bytesIn.length - 1] ?? 0;
  const lastBout = bytesOut[bytesOut.length - 1] ?? 0;
  const samplesNeeded = msgsIn.length < 2;

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title={
          <span>
            {clusterName ?? activeClusterId ?? "Cluster"}{" "}
            {cluster.data && (
              <Badge tone="green" dot className="ml-2 align-middle">Healthy</Badge>
            )}
          </span>
        }
        sub={
          cluster.data
            ? `${cluster.data.kafkaVersion} · ${cluster.data.brokerCount} broker(s) · controller ${cluster.data.controllerId ?? "—"}`
            : "loading…"
        }
        actions={
          <>
            <Button onClick={() => { cluster.refetch(); brokers.refetch(); throughput.refetch(); alerts.refetch(); }}>
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
        <KpiTile label="Brokers" value={cluster.data?.brokerCount ?? <Skeleton className="h-6 w-10" />} sub="online" />
        <KpiTile label="Topics" value={cluster.data?.totalTopics ?? <Skeleton className="h-6 w-10" />} />
        <KpiTile label="Partitions" value={cluster.data?.totalPartitions ?? <Skeleton className="h-6 w-10" />} />
        <KpiTile
          label="Under-replicated"
          value={cluster.data?.underReplicatedPartitions ?? "—"}
          tone={cluster.data && cluster.data.underReplicatedPartitions > 0 ? "amber" : undefined}
        />
        <KpiTile
          label="Offline partitions"
          value={cluster.data?.offlinePartitions ?? "—"}
          tone={cluster.data && cluster.data.offlinePartitions > 0 ? "red" : "green"}
        />
        <KpiTile
          label="Active controller"
          value={cluster.data?.controllerId ?? "—"}
          sub={cluster.data ? <span className="font-mono">broker {cluster.data.controllerId}</span> : null}
        />
      </KpiRow>

      <div className="mb-3.5 grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Messages / sec</CardTitle>
              <div className="text-[11.5px] text-fg-3">Cluster-wide throughput · last 60 samples</div>
            </div>
            <div className="flex gap-2.5 text-[11.5px]">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> In{" "}
                <span key={lastIn} className="font-mono tabular-nums animate-flash">{fmt.rate(Math.round(lastIn))}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Out{" "}
                <span key={lastOut} className="font-mono tabular-nums animate-flash">{fmt.rate(Math.round(lastOut))}</span>
              </span>
            </div>
          </CardHeader>
          <div className="px-1 pb-1.5 pt-2">
            {samplesNeeded ? <NoSamplesYet /> : <DualAreaChart data1={msgsIn} data2={msgsOut} color1="var(--accent)" color2="var(--violet)" />}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Bytes / sec</CardTitle>
              <div className="text-[11.5px] text-fg-3">MB/s in &amp; out · last 60 samples</div>
            </div>
            <div className="flex gap-2.5 text-[11.5px]">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> In{" "}
                <span key={lastBin} className="font-mono tabular-nums animate-flash">{lastBin.toFixed(2)} MB/s</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Out{" "}
                <span key={lastBout} className="font-mono tabular-nums animate-flash">{lastBout.toFixed(2)} MB/s</span>
              </span>
            </div>
          </CardHeader>
          <div className="px-1 pb-1.5 pt-2">
            {samplesNeeded ? <NoSamplesYet /> : <DualAreaChart data1={bytesIn} data2={bytesOut} color1="var(--accent)" color2="var(--violet)" />}
          </div>
        </Card>
      </div>

      <div className="mb-3.5 grid grid-cols-[1.6fr_1fr] gap-3.5 max-[900px]:grid-cols-1">
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
            <CardTitle>Alerts</CardTitle>
            <Badge
              tone={
                (alerts.data ?? []).some((a) => a.severity === "error") ? "red"
                  : (alerts.data ?? []).some((a) => a.severity === "warning") ? "amber" : "green"
              }
            >
              {alerts.data ? alerts.data.filter((a) => a.severity !== "info").length : 0} active
            </Badge>
          </CardHeader>
          <div>
            {alerts.isLoading && <div className="p-3.5"><Skeleton className="h-20" /></div>}
            {alerts.error && <div className="p-3.5"><ErrorState error={alerts.error} /></div>}
            {alerts.data?.map((a, i) => (
              <AlertRow key={a.id} alert={a} last={i === (alerts.data?.length ?? 0) - 1} />
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top topics by throughput</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/topics">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        {throughput.isLoading ? (
          <div className="p-3.5"><Skeleton className="h-32" /></div>
        ) : (throughput.data?.topTopics ?? []).length === 0 ? (
          <div className="p-8 text-center text-[12.5px] text-fg-3">
            {samplesNeeded ? "Collecting samples — first numbers appear within ~10 seconds." : "No non-internal topics yet. Create a topic to see throughput."}
          </div>
        ) : (
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                <th className="px-3 py-1.5 text-left">Topic</th>
                <th className="px-3 py-1.5 text-right">Partitions</th>
                <th className="px-3 py-1.5 text-right">Throughput</th>
                <th className="px-3 py-1.5 text-right">Bytes/s</th>
                <th className="px-3 py-1.5 text-right">Total messages</th>
                <th className="px-3 py-1.5 text-left">Last 30 samples</th>
              </tr>
            </thead>
            <tbody>
              {throughput.data?.topTopics.map((t) => (
                <tr
                  key={t.name}
                  className="cursor-pointer border-b border-border-soft last:border-b-0 hover:bg-bg-hover"
                  onClick={() => router.push(`/topics/${encodeURIComponent(t.name)}`)}
                >
                  <td className="px-3 py-1.5 font-mono">{t.name}</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums">{t.partitions}</td>
                  <td className={cn("px-3 py-1.5 text-right font-mono tabular-nums", t.messagesPerSec > 50_000 && "text-accent")}>
                    {fmt.rate(Math.round(t.messagesPerSec))}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg-3">{(t.bytesPerSec / 1_048_576).toFixed(2)} MB/s</td>
                  <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt.numFull(t.totalMessages)}</td>
                  <td className="w-36 px-3 py-1.5"><Sparkline data={t.sparkline.length > 0 ? t.sparkline : [0, 0]} animated={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function NoSamplesYet() {
  return (
    <div className="grid h-[170px] place-items-center text-center text-[12px] text-fg-3">
      <div>
        <div className="text-fg-2">Collecting samples…</div>
        <div className="mt-1">First chart points appear within ~10 seconds.</div>
      </div>
    </div>
  );
}

function AlertRow({ alert, last }: { alert: Alert; last: boolean }) {
  const Icon = alert.severity === "error" ? XCircle : alert.severity === "warning" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-3.5 py-2.5",
        !last && "border-b border-border-soft",
      )}
    >
      <span
        className={cn(
          "mt-0.5",
          alert.severity === "error" && "text-red",
          alert.severity === "warning" && "text-amber",
          alert.severity === "info" && "text-fg-3",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium">{alert.title}</div>
        <div className="mt-0.5 text-[11.5px] text-fg-3">{alert.body}</div>
        <div className="mt-1 flex gap-2.5 text-[11px] text-fg-4">
          <span>{fmt.ago(alert.ts)}</span>
          {alert.resource && <span className="font-mono">{alert.resource}</span>}
        </div>
      </div>
    </div>
  );
}
