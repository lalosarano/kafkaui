"use client";

import * as React from "react";
import * as RT from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = RT.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof RT.List>,
  React.ComponentPropsWithoutRef<typeof RT.List>
>(({ className, ...props }, ref) => (
  <RT.List
    ref={ref}
    className={cn("flex gap-0 overflow-x-auto border-b border-border [scrollbar-width:none]", className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof RT.Trigger>,
  React.ComponentPropsWithoutRef<typeof RT.Trigger>
>(({ className, ...props }, ref) => (
  <RT.Trigger
    ref={ref}
    className={cn(
      "relative -mb-px inline-flex items-center gap-1.5 border-b-2 border-transparent px-3.5 py-2.5 text-[13px] font-medium text-fg-3 hover:text-fg-2 data-[state=active]:border-accent data-[state=active]:text-fg",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof RT.Content>,
  React.ComponentPropsWithoutRef<typeof RT.Content>
>(({ className, ...props }, ref) => (
  <RT.Content ref={ref} className={cn("mt-4 outline-none", className)} {...props} />
));
TabsContent.displayName = "TabsContent";
