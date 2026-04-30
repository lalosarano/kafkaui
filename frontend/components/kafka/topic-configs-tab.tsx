"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, RotateCcw, Save, Search, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/kafka/error-state";
import { topicsApi } from "@/lib/api/topics";
import type { TopicConfigEntry } from "@/lib/types/kafka";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

export function TopicConfigsTab({ topicName }: { topicName: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const [overridesOnly, setOverridesOnly] = React.useState(false);
  const [edits, setEdits] = React.useState<Record<string, string>>({});

  const configsQ = useQuery({
    queryKey: ["topic-configs", topicName],
    queryFn: () => topicsApi.configs(topicName),
  });

  React.useEffect(() => { if (!editing) setEdits({}); }, [editing]);

  const saveMut = useMutation({
    mutationFn: () => topicsApi.updateConfigs(topicName, edits),
    onSuccess: (fresh) => {
      qc.setQueryData(["topic-configs", topicName], fresh);
      qc.invalidateQueries({ queryKey: ["topic", topicName] });
      setEditing(false);
      setEdits({});
      const n = Object.keys(edits).length;
      toast({ tone: "success", msg: <>Updated {n} config{n === 1 ? "" : "s"} on <span className="font-mono">{topicName}</span></> });
    },
    onError: (err: unknown) => toast({ tone: "error", msg: err instanceof Error ? err.message : "Update failed" }),
  });

  const filtered = React.useMemo(() => {
    const list = configsQ.data ?? [];
    return list.filter((c) => {
      if (overridesOnly && c.source.includes("DEFAULT")) return false;
      if (filter && !c.name.toLowerCase().includes(filter.toLowerCase())) return false;
      return true;
    });
  }, [configsQ.data, filter, overridesOnly]);

  function setEdit(name: string, value: string) {
    setEdits((prev) => {
      const orig = configsQ.data?.find((c) => c.name === name)?.value ?? "";
      const next = { ...prev };
      if (value === orig) delete next[name];
      else next[name] = value;
      return next;
    });
  }

  if (configsQ.isLoading) return <Skeleton className="h-64 w-full" />;
  if (configsQ.error) return <ErrorState error={configsQ.error} />;

  const dirtyCount = Object.keys(edits).length;

  return (
    <div className="overflow-hidden rounded-3 border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-bg-2 px-3 py-2.5">
        <div className="flex h-7 w-60 items-center gap-2 rounded-2 border border-border bg-surface px-2.5 text-fg-3 focus-within:border-accent">
          <Search className="h-3.5 w-3.5" />
          <Input
            className="h-full flex-1 border-0 p-0 text-fg shadow-none focus:border-0 focus:ring-0"
            placeholder="Filter configs…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter configs"
          />
        </div>
        <label className="flex items-center gap-1.5 text-[12px] text-fg-3">
          <Checkbox checked={overridesOnly} onChange={(e) => setOverridesOnly(e.target.checked)} aria-label="Only show overrides" />
          Only show overrides
        </label>
        <div className="flex-1" />
        {editing ? (
          <>
            <span className="text-[12px] text-fg-3">{dirtyCount} change{dirtyCount === 1 ? "" : "s"}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setEditing(false); setEdits({}); }}
              disabled={saveMut.isPending}
            >
              <X className="h-3 w-3" /> Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => saveMut.mutate()}
              disabled={dirtyCount === 0 || saveMut.isPending}
            >
              <Save className="h-3 w-3" /> {saveMut.isPending ? "Saving…" : "Save changes"}
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3" /> Edit configs
          </Button>
        )}
      </div>
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border bg-bg-2 text-[11.5px] font-medium text-fg-3">
            <th className="px-3 py-1.5 text-left">Property</th>
            <th className="px-3 py-1.5 text-left">Value</th>
            <th className="px-3 py-1.5 text-left">Source</th>
            <th className="px-3 py-1.5 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <ConfigRow
              key={c.name}
              entry={c}
              editing={editing && !c.readOnly}
              dirtyValue={edits[c.name]}
              onChange={(v) => setEdit(c.name, v)}
            />
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={4} className="px-3 py-12 text-center text-fg-3">No configs match the filter</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ConfigRow({
  entry, editing, dirtyValue, onChange,
}: {
  entry: TopicConfigEntry;
  editing: boolean;
  dirtyValue: string | undefined;
  onChange: (v: string) => void;
}) {
  const isOverride = !entry.source.includes("DEFAULT");
  const dirty = dirtyValue !== undefined;
  const value = dirty ? dirtyValue! : (entry.value ?? "");
  return (
    <tr className={cn("border-b border-border-soft last:border-b-0", dirty && "bg-amber-bg/30")}>
      <td className="px-3 py-1.5 align-top font-mono text-fg">
        {entry.name}
        {entry.readOnly && <span className="ml-2 text-[10px] text-fg-4">read-only</span>}
        {entry.sensitive && <span className="ml-2 text-[10px] text-fg-4">sensitive</span>}
      </td>
      <td className="px-3 py-1.5 align-middle font-mono">
        {editing ? (
          <Input
            className="h-7 font-mono text-[12.5px]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={entry.value ?? ""}
            disabled={entry.readOnly}
          />
        ) : entry.sensitive && entry.value ? (
          <span className="text-fg-3">••••••</span>
        ) : (
          <span>{entry.value ?? <span className="text-fg-4">—</span>}</span>
        )}
      </td>
      <td className="px-3 py-1.5 align-middle">
        {dirty ? (
          <Badge tone="amber">pending</Badge>
        ) : isOverride ? (
          <Badge tone="accent">override</Badge>
        ) : (
          <span className="text-[11.5px] text-fg-3">default</span>
        )}
      </td>
      <td className="px-3 py-1.5 align-middle">
        {editing && dirty && (
          <Button size="icon-sm" variant="ghost" onClick={() => onChange(entry.value ?? "")} aria-label="Revert">
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </td>
    </tr>
  );
}
