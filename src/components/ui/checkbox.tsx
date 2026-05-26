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
    data-allow-dark-cta
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-[#B89555] bg-[#FDFBF7] ring-offset-background data-[state=checked]:bg-[#102540] data-[state=checked]:border-[#102540] data-[state=checked]:text-white hover:data-[state=checked]:bg-[#102540] focus:data-[state=checked]:bg-[#102540] active:data-[state=checked]:bg-[#102540] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102540]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    style={props.checked ? { backgroundColor: "#102540", borderColor: "#102540" } : undefined}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center")} style={{ color: "#FFFFFF" }}>
      <Check className="h-4 w-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>

));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
