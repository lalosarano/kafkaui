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
import type { Broker } from "@/lib/types/kafka";

export default function BrokersPage() {
  const brokersQ = useQuery({ queryKey: ["brokers"], queryFn: brokersApi.list, refetchInterval: 30_000 });

  const columns = React.useMemo<ColumnDef<Broker>[]>(
    () => [
      { accessorKey: "id", header: "ID", cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.id}</span> },
      { accessorKey: "host", header: "Host", cell: ({ row }) => <span className="font-mono">{row.original.host}:{row.original.port}</span> },
      { accessorKey: "rack", header: "Rack", cell: ({ row }) => <span className="font-mono text-fg-3">{row.original.rack ?? "—"}</span> },
      { id: "role", header: "Role", cell: ({ row }) => row.original.isController ? <Badge tone="accent">controller</Badge> : <span className="text-fg-3">broker</span> },
      { id: "status", header: "Status", cell: () => <StatusBadge state="healthy" /> },
    ],
    [],
  );

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title="Brokers"
        sub={brokersQ.data ? `${brokersQ.data.length} brokers · controller ${brokersQ.data.find((b) => b.isController)?.id ?? "—"}` : "loading…"}
        actions={<Button onClick={() => brokersQ.refetch()}><RefreshCcw className="h-3 w-3" /> Refresh</Button>}
      />
      {brokersQ.error && <ErrorState error={brokersQ.error} />}
      <KpiRow className="mb-3.5">
        <KpiTile label="Online" value={brokersQ.data ? `${brokersQ.data.length} / ${brokersQ.data.length}` : "—"} />
        <KpiTile label="Controllers" value={brokersQ.data?.filter((b) => b.isController).length ?? 0} />
        <KpiTile label="Racks" value={new Set(brokersQ.data?.map((b) => b.rack ?? "—")).size || 0} />
      </KpiRow>
      {brokersQ.isLoading ? <Skeleton className="h-64 w-full" /> : <DataTable columns={columns} data={brokersQ.data ?? []} />}
    </div>
  );
}
