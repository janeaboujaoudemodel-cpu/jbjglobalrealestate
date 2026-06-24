import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, value, defaultValue, onValueChange, onValueCommit, min, max, step, disabled, ...props }, ref) => {
  // Determine how many thumbs to render based on the controlled or default value length.
  const thumbCount =
    (Array.isArray(value) ? value.length : Array.isArray(defaultValue) ? defaultValue.length : 1) || 1;

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      onValueCommit={onValueCommit}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={cn(
        "relative flex w-full select-none items-center touch-none min-h-[44px] px-3",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative h-2 w-full grow overflow-hidden rounded-full cursor-pointer"
        style={{ background: "var(--slider-track-bg, #E6DCC7)" }}
      >
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{
            background: "var(--slider-range-bg, linear-gradient(90deg, #064E3B 0%, #042c1c 58%, #000000 100%))",
            backgroundSize: "var(--slider-range-bg-size, auto)",
            animation: "var(--slider-range-animation, none)",
          }}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block h-6 w-6 rounded-full bg-white",
            "ring-offset-background transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555] focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            "touch-none cursor-grab active:cursor-grabbing",
            "shadow-[0_2px_8px_rgba(6,78,59,0.45),0_0_0_2px_#064E3B_inset]",
            "hover:scale-110 active:scale-95"
          )}
          style={{
            background: "var(--slider-thumb-bg, #FFFFFF)",
            boxShadow: "var(--slider-thumb-shadow, 0 2px 8px rgba(6,78,59,0.45), 0 0 0 2px #064E3B inset)",
          }}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
