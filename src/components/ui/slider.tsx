import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full select-none items-center",
      // CRITICAL: touch-none allows Radix to fully control touch events for dragging
      // This fixes the issue where sliders don't respond to touch on mobile
      "touch-none",
      // Minimum height for better touch target on mobile
      "min-h-[44px]",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary cursor-pointer">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        // Extra large touch target for mobile (h-8 w-8) - meets 44px accessibility guideline
        "block h-8 w-8 rounded-full border-2 border-primary bg-background",
        "ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // touch-none is critical - lets Radix handle all touch events for smooth dragging
        "touch-none cursor-grab active:cursor-grabbing",
        // Enhanced shadow for better visibility and 3D effect
        "shadow-lg hover:shadow-xl active:shadow-2xl active:scale-110",
        // Smooth transitions
        "transition-all duration-150"
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
