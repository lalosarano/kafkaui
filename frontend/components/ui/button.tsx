import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-2 font-medium whitespace-nowrap transition-[background] duration-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        default: "border border-border bg-surface text-fg hover:bg-bg-hover hover:border-border-2",
        primary: "bg-accent text-accent-fg border border-accent hover:bg-accent-2",
        ghost: "bg-transparent text-fg-2 hover:bg-bg-hover hover:text-fg",
        danger: "bg-red text-white border border-red hover:brightness-110",
        outline: "border border-border bg-transparent text-fg hover:bg-bg-hover",
      },
      size: {
        default: "h-7 px-2.5 text-[12.5px]",
        sm: "h-6 px-2 text-[12px]",
        lg: "h-8 px-3 text-[13px]",
        icon: "h-7 w-7 p-0",
        "icon-sm": "h-[22px] w-[22px] p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { buttonVariants };
