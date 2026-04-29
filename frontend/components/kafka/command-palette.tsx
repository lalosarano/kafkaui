"use client";

import { Command } from "cmdk";
import {
  FileJson, LayoutGrid, Plus, RefreshCcw, Search, Send, Server, Shield, Table2, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { topicsApi } from "@/lib/api/topics";
import { consumerGroupsApi } from "@/lib/api/consumer-groups";
import { produceModalEvents } from "./produce-modal";

export const commandPaletteEvents = new EventTarget();

export function CommandPaletteMount() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    commandPaletteEvents.addEventListener("open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      commandPaletteEvents.removeEventListener("open", onOpen);
    };
  }, []);

  const topics = useQuery({
    queryKey: ["topics", { showInternal: false }],
    queryFn: () => topicsApi.list(undefined, false, 0, 100),
    enabled: open,
    staleTime: 30_000,
  });
  const groups = useQuery({
    queryKey: ["consumer-groups"],
    queryFn: () => consumerGroupsApi.list(),
    enabled: open,
    staleTime: 30_000,
  });

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-start justify-center bg-black/40 pt-[12vh]" onClick={() => setOpen(false)}>
      <Command
        className="w-full max-w-[620px] overflow-hidden rounded-4 border border-border-2 bg-bg-2 shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
        label="Command palette"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-3">
          <Search className="h-4 w-4 text-fg-3" />
          <Command.Input className="flex-1 border-0 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-4" placeholder="Type a command, search topics, groups…" autoFocus />
          <kbd className="kbd-key">esc</kbd>
        </div>
        <Command.List className="max-h-[380px] overflow-y-auto py-1.5">
          <Command.Empty className="px-7 py-7 text-center text-[13px] text-fg-3">No results</Command.Empty>

          <Command.Group heading="Navigation" className="px-0 py-1 [&_[cmdk-group-heading]]:px-3.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-4">
            <CmdItem icon={LayoutGrid} onSelect={() => go("/")}>Go to Overview</CmdItem>
            <CmdItem icon={Table2} onSelect={() => go("/topics")}>Go to Topics</CmdItem>
            <CmdItem icon={Users} onSelect={() => go("/consumers")}>Go to Consumer groups</CmdItem>
            <CmdItem icon={FileJson} onSelect={() => go("/schemas")}>Go to Schemas</CmdItem>
            <CmdItem icon={Shield} onSelect={() => go("/acls")}>Go to ACLs</CmdItem>
            <CmdItem icon={Server} onSelect={() => go("/brokers")}>Go to Brokers</CmdItem>
          </Command.Group>

          <Command.Group heading="Actions" className="px-0 py-1 [&_[cmdk-group-heading]]:px-3.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-4">
            <CmdItem icon={Plus} onSelect={() => { setOpen(false); router.push("/topics?create=1"); }}>Create topic</CmdItem>
            <CmdItem icon={Send} onSelect={() => { setOpen(false); produceModalEvents.dispatchEvent(new CustomEvent("open", { detail: {} })); }}>
              Produce a message
            </CmdItem>
            <CmdItem icon={RefreshCcw} onSelect={() => { setOpen(false); window.location.reload(); }}>Refresh metadata</CmdItem>
          </Command.Group>

          {topics.data?.content && topics.data.content.length > 0 && (
            <Command.Group heading="Topics" className="px-0 py-1 [&_[cmdk-group-heading]]:px-3.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-4">
              {topics.data.content.slice(0, 12).map((t) => (
                <CmdItem
                  key={t.name}
                  icon={Table2}
                  mono
                  hint={`${t.partitions} partitions`}
                  onSelect={() => go(`/topics/${encodeURIComponent(t.name)}`)}
                >
                  {t.name}
                </CmdItem>
              ))}
            </Command.Group>
          )}

          {groups.data && groups.data.length > 0 && (
            <Command.Group heading="Consumer groups" className="px-0 py-1 [&_[cmdk-group-heading]]:px-3.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-4">
              {groups.data.slice(0, 8).map((g) => (
                <CmdItem
                  key={g.id}
                  icon={Users}
                  mono
                  hint={`${g.state} · ${g.members} members`}
                  onSelect={() => go(`/consumers?group=${encodeURIComponent(g.id)}`)}
                >
                  {g.id}
                </CmdItem>
              ))}
            </Command.Group>
          )}
        </Command.List>
        <div className="flex items-center gap-3.5 border-t border-border bg-bg px-3.5 py-2 text-[11.5px] text-fg-3">
          <span className="inline-flex items-center gap-1"><kbd className="kbd-key">↑</kbd><kbd className="kbd-key">↓</kbd> navigate</span>
          <span className="inline-flex items-center gap-1"><kbd className="kbd-key">↵</kbd> select</span>
          <span className="inline-flex items-center gap-1"><kbd className="kbd-key">esc</kbd> close</span>
        </div>
      </Command>
    </div>
  );
}

function CmdItem({
  icon: Icon, children, hint, mono, onSelect,
}: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; hint?: string; mono?: boolean; onSelect: () => void }) {
  return (
    <Command.Item
      className="flex cursor-pointer items-center gap-2.5 px-3.5 py-1.5 text-[13px] text-fg-2 data-[selected=true]:bg-bg-active data-[selected=true]:text-fg [&_[data-icon]]:data-[selected=true]:text-accent"
      onSelect={onSelect}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-fg-3" data-icon />
      <span className={cn("flex-1 truncate", mono && "font-mono text-[12px]")}>{children}</span>
      {hint && <span className="text-[11.5px] text-fg-4">{hint}</span>}
    </Command.Item>
  );
}

function cn(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(" "); }
