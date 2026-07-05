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
          "z-[120000] w-72 rounded-xl border border-[#064E3B]/25 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-4 text-[#1A1A1A] shadow-[0_10px_24px_-18px_rgba(6,78,59,0.28)] outline-none duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none data-[side=bottom]:slide-in-from-top-0 data-[side=top]:slide-in-from-bottom-0 data-[side=left]:slide-in-from-right-0 data-[side=right]:slide-in-from-left-0",
          className,
        )}
        style={isFilterDropdown ? { contain: "layout paint", willChange: "auto", transform: "translate3d(0,0,0)", ...style } : style}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
