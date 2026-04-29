import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[80px] w-full resize-y rounded-2 border border-border bg-surface px-2.5 py-2 text-[12.5px] text-fg outline-none placeholder:text-fg-4",
        "focus:border-accent focus:ring-2 focus:ring-accent/25",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
