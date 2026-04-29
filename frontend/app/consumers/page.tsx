"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { RefreshCcw, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/kafka/data-table";
import { ErrorState } from "@/components/kafka/error-state";
import { KpiRow, KpiTile } from "@/components/kafka/kpi";
import { LagIndicator } from "@/components/kafka/lag-indicator";
import { PageHeader } from "@/components/kafka/page-header";
import { ResetOffsetsModal } from "@/components/kafka/reset-offsets-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/kafka/status-badge";
import { consumerGroupsApi } from "@/lib/api/consumer-groups";
import { fmt } from "@/lib/format";
import type { ConsumerGroupSummary } from "@/lib/types/kafka";
import { cn } from "@/lib/utils";

const STATES = ["all", "stable", "rebalancing", "empty", "dead"] as const;

export default function ConsumersPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [filter, setFilter] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState<typeof STATES[number]>("all");
  const [resetTarget, setResetTarget] = React.useState<{ groupId: string; topic: string } | null>(null);

  const groupsQ = useQuery({
    queryKey: ["consumer-groups", { stateFilter }],
    queryFn: () => consumerGroupsApi.list(stateFilter === "all" ? undefined : stateFilter),
  });

  const filtered = React.useMemo(() => {
    const all = groupsQ.data ?? [];
    return all.filter((g) => g.id.toLowerCase().includes(filter.toLowerCase()));
  }, [groupsQ.data, filter]);

  const counts = (state: string) => groupsQ.data?.filter((g) => g.state === state).length ?? 0;
  const totalLag = groupsQ.data?.reduce((s, g) => s + g.totalLag, 0) ?? 0;

  const columns = React.useMemo<ColumnDef<ConsumerGroupSummary>[]>(
    () => [
      { accessorKey: "id", header: "Group ID", cell: ({ row }) => <span className="font-mono">{row.original.id}</span> },
      { accessorKey: "state", header: "State", cell: ({ row }) => <StatusBadge state={row.original.state} /> },
      { accessorKey: "members", header: "Members", meta: { align: "right" }, cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.members}</span> },
      { accessorKey: "totalLag", header: "Total lag", meta: { align: "right" }, cell: ({ row }) => <LagIndicator lag={row.original.totalLag} /> },
      { accessorKey: "protocol", header: "Protocol", cell: ({ row }) => <span className="font-mono text-fg-3 text-[11.5px]">{row.original.protocol ?? "—"}</span> },
      { accessorKey: "coordinator", header: "Coordinator", meta: { align: "right" }, cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.coordinator ?? "—"}</span> },
    ],
    [],
  );

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title="Consumer groups"
        sub={groupsQ.data ? `${groupsQ.data.length} groups` : "loading…"}
        actions={
          <Button onClick={() => groupsQ.refetch()}><RefreshCcw className="h-3 w-3" /> Refresh</Button>
        }
      />

      {groupsQ.error && <ErrorState error={groupsQ.error} />}

      <KpiRow className="mb-3.5">
        <KpiTile label="Stable" value={counts("stable")} sub="groups" />
        <KpiTile label="Rebalancing" value={counts("rebalancing")} tone={counts("rebalancing") > 0 ? "amber" : undefined} />
        <KpiTile label="Empty" value={counts("empty")} />
        <KpiTile label="Dead" value={counts("dead")} tone={counts("dead") > 0 ? "red" : undefined} />
        <KpiTile label="Total lag" value={fmt.num(totalLag)} sub="msgs" />
      </KpiRow>

      <div className="mb-3 flex items-center gap-2 rounded-3 border border-border bg-bg-2 px-3 py-2.5">
        <Input className="w-72" placeholder="Filter by group ID…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <div className="flex items-center rounded-2 border border-border p-0.5">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setStateFilter(s)}
              className={cn(
                "rounded-1 px-2.5 py-0.5 text-[11.5px] capitalize",
                stateFilter === s ? "bg-bg-active text-fg" : "text-fg-3 hover:text-fg-2",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-[12px] text-fg-3">{filtered.length} groups</span>
      </div>

      {groupsQ.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(g) => router.push(`/consumers?group=${encodeURIComponent(g.id)}`)}
          emptyState="No groups match the filter"
        />
      )}

      <ConsumerDrawer />
      {resetTarget && (
        <ResetOffsetsModal
          open={!!resetTarget}
          onOpenChange={(o) => !o && setResetTarget(null)}
          groupId={resetTarget.groupId}
          topic={resetTarget.topic}
        />
      )}
    </div>
  );
}

function ConsumerDrawer() {
  const search = useSearchParams();
  const router = useRouter();
  const groupId = search.get("group");
  const open = !!groupId;
  const [resetOpen, setResetOpen] = React.useState(false);

  const detailQ = useQuery({
    queryKey: ["consumer-group", groupId],
    queryFn: () => consumerGroupsApi.get(groupId!),
    enabled: !!groupId,
  });

  return (
    <>
      <div
        aria-hidden={!open}
        className={cn(
          "absolute inset-0 z-[60] bg-black/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => router.replace("/consumers")}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 z-[60] flex h-full w-[min(820px,70vw)] flex-col border-l border-border bg-bg shadow-[var(--shadow-lg)] transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
          <Button variant="ghost" size="icon-sm" aria-label="Close drawer" onClick={() => router.replace("/consumers")}>×</Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h2 className="m-0 font-mono text-[13px]">{groupId}</h2>
              {detailQ.data && <StatusBadge state={detailQ.data.state} />}
            </div>
            {detailQ.data && (
              <div className="mt-0.5 text-[11.5px] text-fg-3">
                {detailQ.data.members.length} members · coordinator <span className="font-mono">{detailQ.data.coordinator ?? "—"}</span> · {detailQ.data.protocol ?? "—"}
              </div>
            )}
          </div>
          {detailQ.data && detailQ.data.assignments.length > 0 && (
            <Button variant="default" size="sm" onClick={() => setResetOpen(true)}>
              <RotateCcw className="h-3 w-3" /> Reset offsets
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {detailQ.isLoading && <div className="p-3.5"><Skeleton className="h-32" /></div>}
          {detailQ.error && <div className="p-3.5"><ErrorState error={detailQ.error} /></div>}
          {detailQ.data && (
            <>
              <div className="p-3.5">
                <KpiRow>
                  <KpiTile label="Members" value={detailQ.data.members.length} />
                  <KpiTile label="Total lag" value={fmt.numFull(detailQ.data.totalLag)} tone={detailQ.data.totalLag > 10_000 ? "red" : detailQ.data.totalLag > 100 ? "amber" : undefined} />
                  <KpiTile label="Assigned" value={detailQ.data.assignments.length} sub="partitions" />
                </KpiRow>
              </div>
              <div className="px-3.5 pb-3.5">
                <div className="overflow-hidden rounded-3 border border-border">
                  <div className="border-b border-border bg-bg-2 px-3 py-2 text-[12px] font-medium">Partition assignments &amp; lag</div>
                  <table className="w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                        <th className="px-3 py-1.5 text-right">P</th>
                        <th className="px-3 py-1.5 text-left">Topic</th>
                        <th className="px-3 py-1.5 text-left">Member</th>
                        <th className="px-3 py-1.5 text-right">Current</th>
                        <th className="px-3 py-1.5 text-right">End</th>
                        <th className="px-3 py-1.5 text-right">Lag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailQ.data.assignments.map((a) => (
                        <tr key={a.topic + ":" + a.partition} className="border-b border-border-soft last:border-b-0">
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">P{a.partition}</td>
                          <td className="px-3 py-1.5 font-mono">{a.topic}</td>
                          <td className="px-3 py-1.5 font-mono text-[11.5px]">{a.memberId ?? <span className="text-fg-3">— no member —</span>}</td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt.numFull(a.currentOffset ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg-3">{fmt.numFull(a.endOffset ?? 0)}</td>
                          <td className="px-3 py-1.5 text-right"><LagIndicator lag={a.lag} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        {detailQ.data && groupId && (
          <ResetOffsetsModal
            open={resetOpen}
            onOpenChange={setResetOpen}
            groupId={groupId}
            topic={detailQ.data.assignments[0]?.topic ?? ""}
          />
        )}
      </aside>
    </>
  );
}
