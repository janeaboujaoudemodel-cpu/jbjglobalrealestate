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
    data-no-contrast-guard
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-[#B89555] bg-[#FDFBF7] ring-offset-background data-[state=checked]:bg-[#FDFBF7] data-[state=checked]:border-[#B89555] data-[state=checked]:text-[#B89555] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center")} style={{ color: "#B89555" }}>
      <Check className="h-4 w-4" style={{ color: "#B89555", stroke: "#B89555" }} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
