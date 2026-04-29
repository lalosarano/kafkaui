import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LagIndicator({ lag }: { lag: number }) {
  const tone = lag === 0 || lag < 100 ? "green" : lag < 10_000 ? "amber" : "red";
  const dotClass = {
    green: "bg-green shadow-[0_0_0_2px_color-mix(in_oklab,var(--green)_30%,transparent)]",
    amber: "bg-amber shadow-[0_0_0_2px_color-mix(in_oklab,var(--amber)_30%,transparent)]",
    red: "bg-red shadow-[0_0_0_2px_color-mix(in_oklab,var(--red)_30%,transparent)]",
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dotClass)} />
      <span className={cn("font-mono tabular-nums", tone === "red" && "text-red", tone === "amber" && "text-amber", tone === "green" && "text-fg-2")}>
        {fmt.numFull(lag)}
      </span>
    </span>
  );
}
