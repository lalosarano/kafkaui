"use client";

import * as React from "react";
import * as RD from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = RD.Root;
export const DialogTrigger = RD.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof RD.Content>,
  React.ComponentPropsWithoutRef<typeof RD.Content> & { size?: "default" | "lg" }
>(({ className, children, size = "default", ...props }, ref) => (
  <RD.Portal>
    <RD.Overlay className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-10 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
    <RD.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-[80] flex max-h-[86vh] w-full -translate-x-1/2 -translate-y-1/2 flex-col rounded-4 border border-border bg-bg shadow-[var(--shadow-lg)] data-[state=open]:animate-in data-[state=open]:zoom-in-95",
        size === "lg" ? "max-w-[720px]" : "max-w-[540px]",
        className,
      )}
      {...props}
    >
      {children}
    </RD.Content>
  </RD.Portal>
));
DialogContent.displayName = "DialogContent";

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-start gap-3 border-b border-border px-4 pb-3 pt-3.5", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-4 py-3.5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex justify-end gap-2 border-t border-border bg-bg-2 px-3.5 py-3", className)}
      {...props}
    />
  );
}

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof RD.Title>,
  React.ComponentPropsWithoutRef<typeof RD.Title>
>(({ className, ...props }, ref) => (
  <RD.Title ref={ref} className={cn("text-[14px] font-semibold leading-tight", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof RD.Description>,
  React.ComponentPropsWithoutRef<typeof RD.Description>
>(({ className, ...props }, ref) => (
  <RD.Description ref={ref} className={cn("mt-1 text-[12.5px] text-fg-3", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export const DialogClose = RD.Close;
export function DialogCloseIcon({ className, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <RD.Close asChild>
      <button
        className={cn(
          "grid h-7 w-7 place-items-center rounded-2 border border-transparent text-fg-3 hover:border-border hover:bg-bg-hover hover:text-fg",
          className,
        )}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </RD.Close>
  );
}
