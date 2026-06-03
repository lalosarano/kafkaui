"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Table2, Users, FileJson, Shield, Server, Settings, ChevronsLeft, ChevronsRight, Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ClusterSwitcher } from "./cluster-switcher";

const APP_VERSION = "0.1.0";

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
      {/* Brand */}
      <div className={cn("flex h-11 flex-shrink-0 items-center gap-2.5 border-b border-border px-3", collapsed && "justify-center px-0")}>
        <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-2 bg-gradient-to-br from-accent to-violet text-white shadow-[0_2px_10px_-3px_var(--accent)]">
          <Workflow className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-none">
            <div className="text-[13.5px] font-semibold tracking-tight text-fg">Kafka GUI</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-fg-4">Admin console</div>
          </div>
        )}
      </div>

      <ClusterSwitcher collapsed={collapsed} />

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2">
        {!collapsed && (
          <div className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-fg-4">Manage</div>
        )}
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.href === "/" ? pathname === "/" : pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              data-active={active}
              title={collapsed ? n.label : undefined}
              className={cn(
                "group relative flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-2 px-2.5 py-1.5 text-[13px] font-medium text-fg-2 transition-colors hover:bg-bg-hover hover:text-fg",
                active && "bg-bg-3 text-fg",
                collapsed && "justify-center px-2",
              )}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
              <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", active ? "text-accent" : "text-fg-3 group-hover:text-fg-2")} />
              {!collapsed && <span>{n.label}</span>}
            </Link>
          );
        })}
        <div className="flex-1" />
        <Link
          href="/settings"
          data-active={pathname === "/settings"}
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "group relative flex cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-2 px-2.5 py-1.5 text-[13px] font-medium text-fg-2 transition-colors hover:bg-bg-hover hover:text-fg",
            pathname === "/settings" && "bg-bg-3 text-fg",
            collapsed && "justify-center px-2",
          )}
        >
          {pathname === "/settings" && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
          <Settings className={cn("h-4 w-4 flex-shrink-0 transition-colors", pathname === "/settings" ? "text-accent" : "text-fg-3 group-hover:text-fg-2")} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </nav>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-border px-2 py-2">
        {!collapsed ? (
          <div className="flex flex-1 items-center gap-1.5 px-1.5 text-[11px] text-fg-4">
            <span className="font-medium text-fg-3">Kafka GUI</span>
            <span className="rounded-1 bg-bg-3 px-1 py-px font-mono text-[10px] leading-none text-fg-3">v{APP_VERSION}</span>
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          onClick={() => setCollapsed((c) => !c)}
          className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-2 border border-transparent text-fg-3 transition-colors hover:border-border hover:bg-bg-hover hover:text-fg"
        >
          {collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </div>
    </aside>
  );
}
