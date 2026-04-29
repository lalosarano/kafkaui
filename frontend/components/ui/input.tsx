import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-7 w-full rounded-2 border border-border bg-surface px-2.5 text-[12.5px] text-fg outline-none placeholder:text-fg-4",
        "focus:border-accent focus:ring-2 focus:ring-accent/25",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
