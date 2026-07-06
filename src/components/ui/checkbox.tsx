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
    data-radix-checkbox-root
    style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, flex: "0 0 18px" }}
    className={cn(
      "peer relative aspect-square self-start shrink-0 rounded-[4px] border border-[#B89555]/70 bg-[#FDFBF7] ring-offset-background transition-colors select-none",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(184,149,85,0.18)]",
      "data-[state=checked]:border-[#064E3B] data-[state=checked]:bg-[image:var(--jj-emerald-ombre)] data-[state=unchecked]:bg-[#FDFBF7] data-[state=unchecked]:bg-none",
      "data-[state=checked]:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_6px_rgba(6,78,59,0.4)]",
      "hover:border-[#B89555] focus:border-[#B89555]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/40 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <Check
        className="!text-white !stroke-white"
        style={{
          width: "82%",
          height: "82%",
          color: "#FFFFFF",
          stroke: "#FFFFFF",
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
        strokeWidth={3.4}
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
