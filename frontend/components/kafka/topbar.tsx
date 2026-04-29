"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { Bell, HelpCircle, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { commandPaletteEvents } from "./command-palette";
import { cn } from "@/lib/utils";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const crumbs: { label: string; href?: string; current?: boolean; mono?: boolean }[] = [
    { label: "kafka-cluster", href: "/" },
  ];
  if (pathname === "/") crumbs.push({ label: "Overview", current: true });
  else if (pathname.startsWith("/topics")) {
    if (params.name) {
      crumbs.push({ label: "Topics", href: "/topics" });
      crumbs.push({ label: String(params.name), current: true, mono: true });
    } else {
      crumbs.push({ label: "Topics", current: true });
    }
  } else if (pathname.startsWith("/consumers")) crumbs.push({ label: "Consumer groups", current: true });
  else if (pathname.startsWith("/schemas")) crumbs.push({ label: "Schemas", current: true });
  else if (pathname.startsWith("/acls")) crumbs.push({ label: "ACLs", current: true });
  else if (pathname.startsWith("/brokers")) crumbs.push({ label: "Brokers", current: true });
  else if (pathname.startsWith("/settings")) crumbs.push({ label: "Settings", current: true });

  return (
    <div className="flex h-11 flex-shrink-0 items-center gap-3 border-b border-border bg-bg px-3.5">
      <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-fg-3">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-fg-4">/</span>}
            <button
              className={cn(
                "rounded-1 px-1.5 py-0.5 text-fg-2 hover:bg-bg-hover hover:text-fg",
                c.current && "text-fg",
                c.mono && "font-mono text-[12px]",
              )}
              onClick={() => c.href && router.push(c.href)}
              disabled={c.current}
            >
              {c.label}
            </button>
          </span>
        ))}
      </div>
      <div className="flex-1" />
      <button
        onClick={() => commandPaletteEvents.dispatchEvent(new Event("open"))}
        className="flex h-7 w-80 cursor-text items-center gap-2 rounded-2 border border-border bg-bg-2 pl-2.5 pr-2 text-[12.5px] text-fg-3 hover:border-border-2 hover:text-fg-2"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search topics, groups, brokers…</span>
        <span className="ml-auto inline-flex items-center gap-0.5 rounded-1 border border-border bg-bg-3 px-1.5 font-mono text-[10.5px] text-fg-3">⌘K</span>
      </button>
      <div className="flex items-center gap-1.5 px-2 text-[12px] text-fg-3">
        <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-green" />
        <span>Connected</span>
      </div>
      {mounted && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-fg-3"
        >
          <span className="text-[10px] uppercase">{theme === "dark" ? "Lt" : "Dk"}</span>
        </Button>
      )}
      <Button variant="ghost" size="icon" aria-label="Alerts" className="text-fg-3">
        <Bell className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Help" className="text-fg-3">
        <HelpCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
