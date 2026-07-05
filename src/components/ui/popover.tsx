import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ style, ...props }, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', ...style }}
    {...props}
  />
));
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, style, ...props }, ref) => {
  const isFilterDropdown = Boolean((props as Record<string, unknown>)["data-filter-dropdown"]);
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        avoidCollisions={isFilterDropdown ? false : undefined}
        collisionPadding={isFilterDropdown ? 4 : undefined}
        data-surface={isFilterDropdown ? "champagne" : "light"}
        className={cn(
          "z-[120000] w-72 rounded-xl border border-[#064E3B]/25 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-4 text-[#1A1A1A] shadow-[0_16px_40px_-18px_rgba(6,78,59,0.35)] outline-none duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none",
          className,
        )}
        style={isFilterDropdown ? { contain: "layout style paint", ...style } : style}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
