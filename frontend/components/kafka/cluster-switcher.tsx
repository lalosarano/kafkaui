"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { getActiveClusterId, setActiveClusterId, subscribeActiveCluster } from "@/lib/active-cluster";
import { clusterConfigsApi } from "@/lib/api/cluster-configs";
import { cn } from "@/lib/utils";
import { AddClusterModal } from "./add-cluster-modal";
import { ConfirmModal } from "./confirm-modal";
import { toast } from "./toast";

export function ClusterSwitcher({ collapsed }: { collapsed: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [delTarget, setDelTarget] = React.useState<string | null>(null);
  const [activeId, setActiveIdState] = React.useState<string | null>(null);
  const popRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setActiveIdState(getActiveClusterId());
    return subscribeActiveCluster(setActiveIdState);
  }, []);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const clustersQ = useQuery({
    queryKey: ["cluster-configs"],
    queryFn: clusterConfigsApi.list,
    staleTime: 30_000,
  });

  // Auto-select first cluster if none stored
  React.useEffect(() => {
    if (clustersQ.data && clustersQ.data.length > 0 && !activeId) {
      setActiveClusterId(clustersQ.data[0].id);
    }
  }, [clustersQ.data, activeId]);

  const deleteMut = useMutation({
    mutationFn: (id: string) => clusterConfigsApi.delete(id),
    onSuccess: (_v, id) => {
      toast({ tone: "success", msg: <>Cluster <span className="font-mono">{id}</span> removed</> });
      qc.invalidateQueries({ queryKey: ["cluster-configs"] });
      if (activeId === id) {
        const others = (clustersQ.data ?? []).filter((c) => c.id !== id);
        setActiveClusterId(others[0]?.id ?? null);
        setTimeout(() => window.location.reload(), 200);
      }
    },
    onError: (err: unknown) => toast({ tone: "error", msg: err instanceof Error ? err.message : "Delete failed" }),
  });

  const active = clustersQ.data?.find((c) => c.id === activeId) ?? clustersQ.data?.[0];

  function pick(id: string) {
    setActiveClusterId(id);
    setOpen(false);
    setTimeout(() => window.location.reload(), 100);
  }

  return (
    <>
      <div className="relative" ref={popRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center gap-2.5 border-b border-border p-2.5 text-left hover:bg-bg-hover"
          title="Switch cluster"
        >
          <span
            className="h-2 w-2 flex-shrink-0 rounded-full"
            style={{
              backgroundColor: active?.color ?? "var(--green)",
              boxShadow: `0 0 0 3px color-mix(in oklab, ${active?.color ?? "var(--green)"} 25%, transparent)`,
            }}
          />
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="truncate text-[13px] font-semibold text-fg">
                  {active?.name ?? (clustersQ.isLoading ? "loading…" : "No cluster")}
                </div>
                <div className="truncate text-[11px] text-fg-3">
                  {active ? active.bootstrapServers : "Click to add one"}
                </div>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-fg-3" />
            </>
          )}
        </button>

        {open && (
          <div className="absolute left-2 right-2 top-full z-30 mt-1 overflow-hidden rounded-3 border border-border-2 bg-bg-2 shadow-[var(--shadow-lg)]">
            <div className="max-h-[320px] overflow-y-auto py-1">
              {(clustersQ.data ?? []).map((c) => (
                <div
                  key={c.id}
                  className="group flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-[12.5px] hover:bg-bg-hover"
                  onClick={() => pick(c.id)}
                >
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: c.color ?? "var(--green)" }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="truncate font-mono text-[11px] text-fg-3">{c.bootstrapServers}</div>
                  </div>
                  {c.id === active?.id && <Check className="h-3.5 w-3.5 text-accent" />}
                  <button
                    aria-label={`Delete ${c.name}`}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-fg-3 hover:text-red"
                    onClick={(e) => { e.stopPropagation(); setDelTarget(c.id); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {clustersQ.data && clustersQ.data.length === 0 && (
                <div className="px-2.5 py-3 text-center text-[12px] text-fg-3">
                  No clusters yet — click below to add one.
                </div>
              )}
            </div>
            <div className="border-t border-border bg-bg p-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setOpen(false); setAddOpen(true); }}
              >
                <Plus className="h-3 w-3" /> Add cluster
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddClusterModal open={addOpen} onOpenChange={setAddOpen} />
      <ConfirmModal
        open={!!delTarget}
        onOpenChange={(o) => !o && setDelTarget(null)}
        title="Remove cluster"
        description={
          <>Remove the connection <span className="font-mono">{delTarget}</span>? Topics on the actual Kafka cluster are not affected.</>
        }
        confirmLabel="Remove"
        confirmText={delTarget ?? ""}
        onConfirm={async () => { if (delTarget) await deleteMut.mutateAsync(delTarget); }}
      />
    </>
  );
}
