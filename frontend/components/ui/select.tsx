import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-7 w-full rounded-2 border border-border bg-surface px-2.5 text-[12.5px] text-fg outline-none",
        "focus:border-accent focus:ring-2 focus:ring-accent/25",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
