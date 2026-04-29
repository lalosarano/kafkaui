import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 h-[18px] px-1.5 rounded-full text-[11px] font-medium tabular-nums whitespace-nowrap border",
  {
    variants: {
      tone: {
        default: "border-border bg-bg-3 text-fg-2",
        green: "border-green/40 bg-green-bg text-green",
        amber: "border-amber/40 bg-amber-bg text-amber",
        red: "border-red/40 bg-red-bg text-red",
        violet: "border-violet/40 bg-violet-bg text-violet",
        accent: "border-accent/40 bg-accent-soft text-accent",
        gray: "border-border bg-bg-3 text-fg-3",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, children, dot, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
