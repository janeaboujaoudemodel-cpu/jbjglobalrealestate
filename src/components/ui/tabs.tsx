import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/**
 * Tabs / Segmented Control — single source of truth.
 *
 * Active-state contrast (white text/icons on emerald) is owned 100%
 * by the DESIGN SYSTEM v1 contrast contract in `src/index.css`
 * via `[role="tab"][data-state="active"]` and
 * `[data-jj-segmented-trigger][data-state="active"]`.
 *
 * Do NOT add MutationObservers, inline color forcing, or
 * `data-[state=active]:text-*` utilities here — they create the
 * stacking wars we just deleted.
 */

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-surface="champagne"
    data-jj-segmented-list=""
    className={cn(
      "surface-champagne inline-flex h-10 items-center justify-center rounded-md bg-[color:var(--surface,#F7F2EA)] p-1 text-[#1A1A1A] border border-[color:var(--emerald-1)]/25",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    data-jj-segmented-trigger=""
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors duration-150 text-[#1A1A1A] data-[state=active]:!text-white data-[state=active]:[-webkit-text-fill-color:#fff] hover:bg-[color:var(--emerald-soft-bg)] hover:text-[color:var(--emerald-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--emerald-1)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
      className,
    )}
    {...props}
  />

));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
