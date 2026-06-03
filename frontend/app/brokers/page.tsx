"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { RefreshCcw } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/kafka/data-table";
import { ErrorState } from "@/components/kafka/error-state";
import { KpiRow, KpiTile } from "@/components/kafka/kpi";
import { PageHeader } from "@/components/kafka/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/kafka/status-badge";
import { brokersApi } from "@/lib/api/brokers";
import { clusterApi } from "@/lib/api/cluster";
import { fmt } from "@/lib/format";
import type { Broker } from "@/lib/types/kafka";
import { cn } from "@/lib/utils";

export default function BrokersPage() {
  const brokersQ = useQuery({ queryKey: ["brokers"], queryFn: brokersApi.list, refetchInterval: 30_000 });
  const clusterQ = useQuery({ queryKey: ["cluster"], queryFn: clusterApi.current, refetchInterval: 30_000 });
  const ci = clusterQ.data;

  const onlinePartitions = ci ? ci.totalPartitions - ci.offlinePartitions : null;
  const outOfSync = ci ? ci.totalReplicas - ci.inSyncReplicas : null;

  const columns = React.useMemo<ColumnDef<Broker>[]>(
    () => [
      { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.id}</span> },
      { accessorKey: "host", header: "Host", cell: ({ row }) => <span className="font-mono">{row.original.host}</span> },
      { accessorKey: "port", header: "Port", cell: ({ row }) => <span className="font-mono tabular-nums text-fg-3">{row.original.port}</span> },
      { accessorKey: "rack", header: "Rack", cell: ({ row }) => <span className="font-mono text-fg-3">{row.original.rack ?? "—"}</span> },
      { id: "role", header: "Role", cell: ({ row }) => row.original.isController ? <Badge tone="accent">controller</Badge> : <span className="text-fg-3">broker</span> },
      {
        accessorKey: "leaders", header: "Leaders",
        cell: ({ row }) => <span className="font-mono tabular-nums">{fmt.numFull(row.original.leaders)}</span>,
      },
      {
        accessorKey: "leaderSkew", header: "Leader skew",
        cell: ({ row }) => <SkewCell value={row.original.leaderSkew} />,
      },
      {
        accessorKey: "partitions", header: "Partitions",
        cell: ({ row }) => <span className="font-mono tabular-nums">{fmt.numFull(row.original.partitions)}</span>,
      },
      {
        id: "online", header: "Online",
        cell: ({ row }) => {
          const b = row.original;
          const full = b.onlinePartitions >= b.partitions;
          return <span className={cn("font-mono tabular-nums", full ? "text-fg-2" : "text-amber")}>{fmt.numFull(b.onlinePartitions)}</span>;
        },
      },
      {
        id: "disk", header: "Disk usage",
        cell: ({ row }) => {
          const b = row.original;
          if (b.diskBytes < 0) return <span className="text-fg-4">—</span>;
          return (
            <span className="font-mono tabular-nums">
              {fmt.bytes(b.diskBytes / 1_048_576)}
              <span className="ml-1.5 text-fg-4">· {fmt.numFull(b.logSegments)} seg</span>
            </span>
          );
        },
      },
      { id: "status", header: "Status", cell: () => <StatusBadge state="healthy" /> },
    ],
    [],
  );

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title="Brokers"
        sub={ci ? `${ci.brokerCount} brokers · controller ${ci.controllerId ?? "—"} · ${ci.kafkaVersion}` : "loading…"}
        actions={<Button onClick={() => { brokersQ.refetch(); clusterQ.refetch(); }}><RefreshCcw className="h-3 w-3" /> Refresh</Button>}
      />

      {brokersQ.error && <ErrorState error={brokersQ.error} />}

      <KpiRow className="mb-3.5">
        <KpiTile label="Brokers" value={ci?.brokerCount ?? <Skeleton className="h-6 w-10" />} sub="online" />
        <KpiTile label="Active controller" value={ci ? (ci.controllerId ?? "—") : <Skeleton className="h-6 w-10" />} sub={ci?.controllerId != null ? `broker ${ci.controllerId}` : null} />
        <KpiTile label="Version" value={ci ? <span className="text-[16px]">{ci.kafkaVersion}</span> : <Skeleton className="h-6 w-16" />} />
        <KpiTile
          label="Online partitions"
          value={onlinePartitions != null ? fmt.numFull(onlinePartitions) : <Skeleton className="h-6 w-12" />}
          sub={ci ? `of ${fmt.numFull(ci.totalPartitions)}` : null}
          tone={ci && ci.offlinePartitions > 0 ? "red" : undefined}
        />
        <KpiTile
          label="Under-replicated"
          value={ci?.underReplicatedPartitions ?? <Skeleton className="h-6 w-10" />}
          tone={ci && ci.underReplicatedPartitions > 0 ? "amber" : undefined}
        />
        <KpiTile
          label="In-sync replicas"
          value={ci ? fmt.numFull(ci.inSyncReplicas) : <Skeleton className="h-6 w-12" />}
          sub={ci ? `of ${fmt.numFull(ci.totalReplicas)}` : null}
        />
        <KpiTile
          label="Out-of-sync replicas"
          value={outOfSync != null ? fmt.numFull(outOfSync) : <Skeleton className="h-6 w-10" />}
          tone={outOfSync != null && outOfSync > 0 ? "red" : "green"}
        />
      </KpiRow>

      {brokersQ.isLoading ? <Skeleton className="h-64 w-full" /> : <DataTable columns={columns} data={brokersQ.data ?? []} />}
    </div>
  );
}

function SkewCell({ value }: { value: number }) {
  const abs = Math.abs(value);
  const sign = value > 0 ? "+" : "";
  return (
    <span className={cn("font-mono tabular-nums", abs >= 20 ? "text-amber" : "text-fg-3")}>
      {sign}{value.toFixed(2)}%
    </span>
  );
}
