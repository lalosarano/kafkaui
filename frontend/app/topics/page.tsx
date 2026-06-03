"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Plus, Search, Send, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/kafka/confirm-modal";
import { CreateTopicModal } from "@/components/kafka/create-topic-modal";
import { DataTable } from "@/components/kafka/data-table";
import { ErrorState } from "@/components/kafka/error-state";
import { PageHeader } from "@/components/kafka/page-header";
import { produceModalEvents } from "@/components/kafka/produce-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { topicsApi } from "@/lib/api/topics";
import { fmt } from "@/lib/format";
import type { Topic } from "@/lib/types/kafka";
import { toast } from "@/components/kafka/toast";

export default function TopicsPage() {
  return (
    <React.Suspense fallback={null}>
      <TopicsPageInner />
    </React.Suspense>
  );
}

function TopicsPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState("");
  const [showInternal, setShowInternal] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(search.get("create") === "1");
  const [delTarget, setDelTarget] = React.useState<string | null>(null);

  const topicsQ = useQuery({
    queryKey: ["topics", { showInternal }],
    queryFn: () => topicsApi.list(undefined, showInternal, 0, 500),
  });

  const deleteMut = useMutation({
    mutationFn: (name: string) => topicsApi.delete(name),
    onSuccess: (_data, name) => {
      toast({ tone: "success", msg: <>Topic <span className="font-mono">{name}</span> deleted</> });
      qc.invalidateQueries({ queryKey: ["topics"] });
    },
    onError: (err: unknown) => toast({ tone: "error", msg: err instanceof Error ? err.message : "Delete failed" }),
  });

  const filtered = React.useMemo(() => {
    const all = topicsQ.data?.content ?? [];
    if (!filter) return all;
    return all.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));
  }, [topicsQ.data, filter]);

  const columns = React.useMemo<ColumnDef<Topic>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <span className={`font-mono ${row.original.internal ? "text-fg-3" : "text-fg"}`}>{row.original.name}</span>
            {row.original.internal && <Badge tone="violet">internal</Badge>}
          </span>
        ),
      },
      { accessorKey: "partitions", header: "Partitions", meta: { align: "right" }, cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.partitions}</span> },
      { accessorKey: "replicationFactor", header: "RF", meta: { align: "right" }, cell: ({ row }) => <span className="font-mono tabular-nums">{row.original.replicationFactor}</span> },
      {
        accessorKey: "messages",
        header: "Messages",
        meta: { align: "right" },
        cell: ({ row }) => <span className="font-mono tabular-nums">{fmt.numFull(row.original.messages)}</span>,
      },
      {
        accessorKey: "sizeBytes",
        header: "Size",
        meta: { align: "right" },
        cell: ({ row }) =>
          row.original.sizeBytes < 0
            ? <span className="text-fg-4">—</span>
            : <span className="font-mono tabular-nums">{fmt.bytes(row.original.sizeBytes / 1_048_576)}</span>,
      },
      {
        id: "actions",
        header: () => null,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" aria-label="View messages" onClick={() => router.push(`/topics/${encodeURIComponent(row.original.name)}`)}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Produce" onClick={() => produceModalEvents.dispatchEvent(new CustomEvent("open", { detail: { topic: row.original.name } }))}>
              <Send className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => setDelTarget(row.original.name)} className="text-fg-3 hover:text-red">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <div className="max-w-[1600px] animate-fade-in p-5 pb-20">
      <PageHeader
        title="Topics"
        sub={topicsQ.data ? `${topicsQ.data.totalElements} topics` : "loading…"}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3 w-3" /> Create topic
          </Button>
        }
      />

      {topicsQ.error && <ErrorState error={topicsQ.error} />}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-3 border border-border bg-bg-2 px-3 py-2.5">
          <div className="flex h-7 w-72 items-center gap-2 rounded-2 border border-border bg-surface px-2.5 text-fg-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
            <Search className="h-3.5 w-3.5" />
            <Input
              className="h-full flex-1 border-0 p-0 text-fg shadow-none focus:border-0 focus:ring-0"
              placeholder="Filter topics by name…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Filter topics"
            />
            <kbd className="kbd-key">/</kbd>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-fg-3">
            <Checkbox checked={showInternal} onChange={(e) => setShowInternal(e.target.checked)} aria-label="Show system topics" />
            Show system topics
          </label>
          <div className="flex-1" />
          <span className="text-[12px] text-fg-3">{filtered.length} of {topicsQ.data?.totalElements ?? 0}</span>
        </div>

        {topicsQ.isLoading ? (
          <div className="rounded-3 border border-border bg-surface p-3.5">
            <Skeleton className="mb-2 h-6 w-full" />
            <Skeleton className="mb-2 h-6 w-full" />
            <Skeleton className="mb-2 h-6 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            globalFilter={filter}
            onRowClick={(t) => router.push(`/topics/${encodeURIComponent(t.name)}`)}
            emptyState="No topics match the filter"
          />
        )}
      </div>

      <CreateTopicModal open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmModal
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title="Delete topic"
        description={
          <>
            This will permanently delete <span className="font-mono">{delTarget}</span> and all its data. This cannot be undone.
          </>
        }
        confirmLabel="Delete topic"
        confirmText={delTarget ?? ""}
        onConfirm={async () => { if (delTarget) await deleteMut.mutateAsync(delTarget); }}
      />
    </div>
  );
}
