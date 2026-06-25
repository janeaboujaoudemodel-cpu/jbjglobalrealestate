import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-emerald-ok="checkbox"
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-[5px] border-[1.5px] border-[#B89555] bg-[#FDFBF7] ring-offset-background transition-all",
      // 3D resting state — subtle inner highlight + soft drop shadow
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(184,149,85,0.18)]",
      // Checked: locked emerald → black gradient with pure white tick.
      "data-[state=checked]:border-[#064E3B] data-[state=checked]:bg-[image:var(--jj-emerald-ombre)]",
      "data-[state=checked]:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_3px_8px_rgba(6,78,59,0.45)]",
      "hover:border-[#B89555] focus:border-[#B89555]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/40 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center")}>
      <Check
        className="h-4 w-4"
        style={{
          color: "#FFFFFF",
          stroke: "#FFFFFF",
          filter: "drop-shadow(0 1px 0 rgba(58,42,8,0.45))",
        }}
        strokeWidth={4}
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
