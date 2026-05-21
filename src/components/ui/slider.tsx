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
      "relative flex w-full select-none items-center touch-none min-h-[44px]",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-2 w-full grow overflow-hidden rounded-full cursor-pointer"
      style={{ background: "#EFE6D6" }}
    >
      <SliderPrimitive.Range
        className="absolute h-full rounded-full"
        style={{
          background: "linear-gradient(90deg, #ECE2D2 0%, #D8C28F 45%, #B89555 100%)",
        }}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-6 w-6 rounded-full bg-white",
        "ring-offset-background transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "touch-none cursor-grab active:cursor-grabbing",
        "shadow-[0_2px_8px_rgba(184,149,85,0.45),0_0_0_2px_#B89555_inset]",
        "hover:scale-110 active:scale-95"
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
