import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const stripActiveInkUtilities = (className?: string) =>
  className
    ?.split(/\s+/)
    .filter((token) => {
      const activeText = token.startsWith("data-[state=active]:text-");
      return !(
        activeText &&
        (token.includes("[#1A1A1A]") ||
          token.includes("black") ||
          token.includes("foreground"))
      );
    })
    .join(" ");

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
      "surface-champagne inline-flex h-10 items-center justify-center rounded-md bg-[#F7F2EA] p-1 text-[#1A1A1A] border border-[#B89555]/30",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, style, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    data-surface="champagne"
    data-jj-segmented-trigger=""
    style={style}
    className={cn(
      "surface-champagne inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium text-[#1A1A1A] ring-offset-background transition-colors duration-150 hover:bg-[#EFE6D6] hover:text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
      stripActiveInkUtilities(className),
      "data-[state=active]:jj-segmented-active data-[state=active]:!bg-[#064E3B] data-[state=active]:!bg-none data-[state=active]:!text-white data-[state=active]:!shadow-sm data-[state=active]:!animate-none data-[state=active]:[background-image:none!important] [&[data-state=active]_*]:!text-white [&[data-state=active]_svg]:!text-white [&[data-state=active]_svg]:!stroke-white",
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
