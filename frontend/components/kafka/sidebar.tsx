"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Table2, Users, FileJson, Shield, Server, Settings, ChevronsUpDown, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { clusterApi } from "@/lib/api/cluster";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/topics", label: "Topics", icon: Table2 },
  { href: "/consumers", label: "Consumer groups", icon: Users },
  { href: "/schemas", label: "Schemas", icon: FileJson },
  { href: "/acls", label: "ACLs", icon: Shield },
  { href: "/brokers", label: "Brokers", icon: Server },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: cluster } = useQuery({
    queryKey: ["cluster"],
    queryFn: clusterApi.current,
    staleTime: 30_000,
    retry: 0,
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      "grid-template-columns",
      collapsed ? "56px 1fr" : "232px 1fr",
    );
  }, [collapsed]);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden border-r border-border bg-bg-2",
        "[grid-column:1]",
      )}
      style={{ width: collapsed ? 56 : 232 }}
    >
      <div className="flex cursor-pointer items-center gap-2.5 border-b border-border p-2.5 hover:bg-bg-hover" title="Switch cluster">
        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-green shadow-[0_0_0_3px_color-mix(in_oklab,var(--green)_25%,transparent)]" />
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="truncate text-[13px] font-semibold text-fg">{cluster?.clusterId ?? "kafka-cluster"}</div>
              <div className="truncate text-[11px] text-fg-3">
                {cluster ? `${cluster.brokerCount} brokers` : "loading…"}
              </div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 text-fg-3" />
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-y-auto p-2">
        {!collapsed && <div className="px-2.5 pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-fg-4">Cluster</div>}
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              data-active={active}
              className={cn(
                "relative flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-2 px-2.5 py-1.5 text-[13px] font-medium text-fg-2 hover:bg-bg-hover hover:text-fg",
                active && "bg-bg-3 text-fg",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-accent" : "text-fg-3")} />
              {!collapsed && <span>{n.label}</span>}
            </Link>
          );
        })}
        <div className="flex-1" />
        <Link
          href="/settings"
          data-active={pathname === "/settings"}
          className={cn(
            "relative flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-2 px-2.5 py-1.5 text-[13px] font-medium text-fg-2 hover:bg-bg-hover hover:text-fg",
            pathname === "/settings" && "bg-bg-3 text-fg",
            collapsed && "justify-center px-2",
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0 text-fg-3" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </nav>

      <div className="flex items-center gap-2 border-t border-border p-2">
        <div className="flex flex-1 cursor-pointer items-center gap-2 rounded-2 px-2 py-1.5 hover:bg-bg-hover">
          <div className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-violet text-[11px] font-semibold text-white">
            KU
          </div>
          {!collapsed && (
            <div className="min-w-0 truncate text-[12px] font-medium leading-tight">
              admin
              <br />
              <span className="font-normal text-fg-3">platform</span>
            </div>
          )}
        </div>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((c) => !c)}
          className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-2 border border-transparent text-fg-3 hover:border-border hover:bg-bg-hover hover:text-fg"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
}
