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
      "peer h-4 w-4 shrink-0 rounded-sm border border-[#B89555] bg-[#FDFBF7] ring-offset-background data-[state=checked]:bg-[#FDFBF7] data-[state=checked]:border-[#102540] data-[state=checked]:text-[#102540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102540]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center")} style={{ color: "#102540" }}>
      <Check className="h-4 w-4" style={{ color: "#102540", stroke: "#102540" }} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
