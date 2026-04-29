import * as React from "react";
import { cn } from "@/lib/utils";

export function KpiRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-0 overflow-hidden rounded-3 border border-border bg-surface",
        "[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]",
        "[&>*]:border-r [&>*]:border-border [&>*:last-child]:border-r-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function KpiTile({
  label, value, sub, tone,
}: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "amber" | "red" | "green" }) {
  return (
    <div className="flex flex-col gap-0.5 p-3.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-fg-3">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={cn(
          "text-[22px] font-semibold tracking-tight tabular-nums",
          tone === "amber" && "text-amber",
          tone === "red" && "text-red",
          tone === "green" && "text-green",
        )}>
          {value}
        </div>
        {sub && <span className="text-[12px] text-fg-3">{sub}</span>}
      </div>
    </div>
  );
}
