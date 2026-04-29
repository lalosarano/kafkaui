import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLLabelElement, CheckboxProps>(
  ({ className, checked, indeterminate, onChange, disabled, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "relative inline-flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-[3px] border border-border-2 bg-surface",
          (checked || indeterminate) && "border-accent bg-accent text-white",
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
        {indeterminate ? (
          <Minus className="pointer-events-none h-2.5 w-2.5" strokeWidth={3} />
        ) : checked ? (
          <Check className="pointer-events-none h-2.5 w-2.5" strokeWidth={3} />
        ) : null}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
