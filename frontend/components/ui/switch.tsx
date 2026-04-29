import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Switch = React.forwardRef<HTMLLabelElement, SwitchProps>(
  ({ className, checked, onChange, disabled, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "relative inline-block h-4 w-7 cursor-pointer rounded-full border border-border-2 bg-bg-3 transition-colors",
        checked && "border-accent bg-accent",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type="checkbox"
        className="absolute h-full w-full cursor-pointer appearance-none opacity-0"
        checked={!!checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      <span
        className={cn(
          "absolute left-px top-px h-3 w-3 rounded-full bg-fg-2 transition-transform",
          checked && "translate-x-3 bg-white",
        )}
      />
    </label>
  ),
);
Switch.displayName = "Switch";
