import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { tone: "green" | "amber" | "red" | "violet" | "gray"; label: string }> = {
  stable: { tone: "green", label: "Stable" },
  rebalancing: { tone: "amber", label: "Rebalancing" },
  preparingrebalance: { tone: "amber", label: "Rebalancing" },
  completingrebalance: { tone: "amber", label: "Rebalancing" },
  empty: { tone: "gray", label: "Empty" },
  dead: { tone: "red", label: "Dead" },
  healthy: { tone: "green", label: "Healthy" },
  warning: { tone: "amber", label: "Warning" },
  error: { tone: "red", label: "Error" },
  internal: { tone: "violet", label: "Internal" },
};

export function StatusBadge({ state }: { state: string }) {
  const s = MAP[state.toLowerCase()] ?? { tone: "gray" as const, label: state };
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}
