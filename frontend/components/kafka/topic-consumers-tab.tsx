"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, RotateCcw, Users } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "./error-state";
import { KpiRow, KpiTile } from "./kpi";
import { LagIndicator } from "./lag-indicator";
import { ResetOffsetsModal } from "./reset-offsets-modal";
import { StatusBadge } from "./status-badge";
import { consumerGroupsApi } from "@/lib/api/consumer-groups";
import { fmt } from "@/lib/format";
import type { TopicConsumerGroup } from "@/lib/types/kafka";
import { cn } from "@/lib/utils";

const STATES = ["all", "stable", "rebalancing", "empty", "dead"] as const;

/** Topic-scoped view: which consumer groups read this topic, and their lag. */
export function TopicConsumersTab({ topicName }: { topicName: string }) {
  const [selected, setSelected] = React.useState<string | null>(null);

  if (selected) {
    return <GroupDetail topicName={topicName} groupId={selected} onBack={() => setSelected(null)} />;
  }
  return <GroupList topicName={topicName} onSelect={setSelected} />;
}

function GroupList({ topicName, onSelect }: { topicName: string; onSelect: (id: string) => void }) {
  const [filter, setFilter] = React.useState("");
  const [stateFilter, setStateFilter] = React.useState<typeof STATES[number]>("all");

  const q = useQuery({
    queryKey: ["topic-consumers", topicName],
    queryFn: () => consumerGroupsApi.forTopic(topicName),
    refetchInterval: 15_000,
  });

  const all = q.data ?? [];
  const counts = (s: string) => all.filter((g) => g.state === s).length;
  const totalLag = all.reduce((sum, g) => sum + g.lag, 0);

  const filtered = React.useMemo(
    () =>
      all.filter(
        (g) =>
          (stateFilter === "all" || g.state === stateFilter) &&
          g.groupId.toLowerCase().includes(filter.toLowerCase()),
      ),
    [all, filter, stateFilter],
  );

  if (q.isLoading) return <Skeleton className="h-48 w-full" />;
  if (q.error) return <ErrorState error={q.error} />;

  if (all.length === 0) {
    return (
      <div className="rounded-3 border border-border bg-surface p-10 text-center text-[12.5px] text-fg-3">
        <Users className="mx-auto mb-2 h-5 w-5 text-fg-4" />
        No consumer groups have committed offsets on this topic.
      </div>
    );
  }

  return (
    <div>
      <KpiRow className="mb-3.5">
        <KpiTile label="Groups" value={all.length} />
        <KpiTile label="Stable" value={counts("stable")} sub="groups" />
        <KpiTile label="Rebalancing" value={counts("rebalancing")} tone={counts("rebalancing") > 0 ? "amber" : undefined} />
        <KpiTile label="Empty" value={counts("empty")} />
        <KpiTile label="Total lag" value={fmt.num(totalLag)} sub="msgs" tone={totalLag > 10_000 ? "red" : totalLag > 100 ? "amber" : undefined} />
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
        <span className="text-[12px] text-fg-3">{filtered.length} of {all.length}</span>
      </div>

      <div className="overflow-hidden rounded-3 border border-border bg-surface">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
              <th className="px-3 py-1.5 text-left">Group ID</th>
              <th className="px-3 py-1.5 text-left">State</th>
              <th className="px-3 py-1.5 text-right">Members</th>
              <th className="px-3 py-1.5 text-right">Partitions</th>
              <th className="px-3 py-1.5 text-right">Lag</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g: TopicConsumerGroup) => (
              <tr
                key={g.groupId}
                onClick={() => onSelect(g.groupId)}
                className="cursor-pointer border-b border-border-soft last:border-b-0 hover:bg-bg-hover"
              >
                <td className="px-3 py-1.5 font-mono">{g.groupId}</td>
                <td className="px-3 py-1.5"><StatusBadge state={g.state} /></td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{g.members}</td>
                <td className="px-3 py-1.5 text-right font-mono tabular-nums">{g.assignedPartitions}</td>
                <td className="px-3 py-1.5 text-right"><LagIndicator lag={g.lag} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-10 text-center text-fg-3">No groups match the filter</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupDetail({ topicName, groupId, onBack }: { topicName: string; groupId: string; onBack: () => void }) {
  const [resetOpen, setResetOpen] = React.useState(false);
  const detailQ = useQuery({
    queryKey: ["consumer-group", groupId],
    queryFn: () => consumerGroupsApi.get(groupId),
    refetchInterval: 15_000,
  });

  // Only this topic's assignments — we're inside the topic context.
  const assignments = (detailQ.data?.assignments ?? []).filter((a) => a.topic === topicName);
  const topicLag = assignments.reduce((s, a) => s + a.lag, 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-3 w-3" /> Back to consumers
        </Button>
        <span className="font-mono text-[13px]">{groupId}</span>
        {detailQ.data && <StatusBadge state={detailQ.data.state} />}
        <div className="flex-1" />
        {assignments.length > 0 && (
          <Button variant="default" size="sm" onClick={() => setResetOpen(true)}>
            <RotateCcw className="h-3 w-3" /> Reset offsets
          </Button>
        )}
      </div>

      {detailQ.isLoading && <Skeleton className="h-40 w-full" />}
      {detailQ.error && <ErrorState error={detailQ.error} />}

      {detailQ.data && (
        <>
          <KpiRow className="mb-3.5">
            <KpiTile label="Members" value={detailQ.data.members.length} />
            <KpiTile label="Partitions" value={assignments.length} sub="on this topic" />
            <KpiTile label="Topic lag" value={fmt.numFull(topicLag)} tone={topicLag > 10_000 ? "red" : topicLag > 100 ? "amber" : undefined} />
            <KpiTile label="Coordinator" value={detailQ.data.coordinator ?? "—"} />
          </KpiRow>

          <div className="overflow-hidden rounded-3 border border-border bg-surface">
            <div className="border-b border-border bg-bg-2 px-3 py-2 text-[12px] font-medium">
              Partition assignments &amp; lag on <span className="font-mono">{topicName}</span>
            </div>
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
                  <th className="px-3 py-1.5 text-right">P</th>
                  <th className="px-3 py-1.5 text-left">Member</th>
                  <th className="px-3 py-1.5 text-right">Current</th>
                  <th className="px-3 py-1.5 text-right">End</th>
                  <th className="px-3 py-1.5 text-right">Lag</th>
                </tr>
              </thead>
              <tbody>
                {assignments
                  .sort((a, b) => a.partition - b.partition)
                  .map((a) => (
                    <tr key={a.partition} className="border-b border-border-soft last:border-b-0">
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">P{a.partition}</td>
                      <td className="px-3 py-1.5 font-mono text-[11.5px]">{a.memberId ?? <span className="text-fg-3">— no member —</span>}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums">{fmt.numFull(a.currentOffset ?? 0)}</td>
                      <td className="px-3 py-1.5 text-right font-mono tabular-nums text-fg-3">{fmt.numFull(a.endOffset ?? 0)}</td>
                      <td className="px-3 py-1.5 text-right"><LagIndicator lag={a.lag} /></td>
                    </tr>
                  ))}
                {assignments.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-fg-3">This group has no committed offsets on {topicName}.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <ResetOffsetsModal open={resetOpen} onOpenChange={setResetOpen} groupId={groupId} topic={topicName} />
        </>
      )}
    </div>
  );
}
