"use client";

import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { ErrorState } from "./error-state";
import { LagIndicator } from "./lag-indicator";
import { StatusBadge } from "./status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { consumerGroupsApi } from "@/lib/api/consumer-groups";

/** Topic-scoped view: which consumer groups read this topic, and their lag. */
export function TopicConsumersTab({ topicName }: { topicName: string }) {
  const router = useRouter();
  const q = useQuery({
    queryKey: ["topic-consumers", topicName],
    queryFn: () => consumerGroupsApi.forTopic(topicName),
    refetchInterval: 15_000,
  });

  if (q.isLoading) return <Skeleton className="h-48 w-full" />;
  if (q.error) return <ErrorState error={q.error} />;

  const groups = q.data ?? [];
  if (groups.length === 0) {
    return (
      <div className="rounded-3 border border-border bg-surface p-10 text-center text-[12.5px] text-fg-3">
        <Users className="mx-auto mb-2 h-5 w-5 text-fg-4" />
        No consumer groups have committed offsets on this topic.
      </div>
    );
  }

  return (
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
          {groups.map((g) => (
            <tr
              key={g.groupId}
              onClick={() => router.push(`/consumers?group=${encodeURIComponent(g.groupId)}`)}
              className="cursor-pointer border-b border-border-soft last:border-b-0 hover:bg-bg-hover"
              title="Open in consumer groups"
            >
              <td className="px-3 py-1.5 font-mono">{g.groupId}</td>
              <td className="px-3 py-1.5"><StatusBadge state={g.state} /></td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums">{g.members}</td>
              <td className="px-3 py-1.5 text-right font-mono tabular-nums">{g.assignedPartitions}</td>
              <td className="px-3 py-1.5 text-right"><LagIndicator lag={g.lag} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
