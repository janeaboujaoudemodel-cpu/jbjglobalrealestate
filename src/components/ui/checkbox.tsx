import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Applies stroke/color as inline !important on the SVG and its <path> children.
 * Inline `!important` beats every CSS rule regardless of specificity — this is
 * the only reliable way to keep the tick white when a Radix Checkbox lives
 * inside a champagne / surface-light contrast-guard scope (My Projects, CRM
 * tables, bulk toolbars, project cards, etc.).
 */
const useForceWhiteTickRef = () => {
  const ref = React.useRef<SVGSVGElement | null>(null);
  React.useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const apply = () => {
      svg.style.setProperty("color", "#FFFFFF", "important");
      svg.style.setProperty("stroke", "#FFFFFF", "important");
      svg.style.setProperty("fill", "none", "important");
      svg.style.setProperty("opacity", "1", "important");
      svg.querySelectorAll("path, polyline, line").forEach((el) => {
        (el as SVGElement).style.setProperty("stroke", "#FFFFFF", "important");
        (el as SVGElement).style.setProperty("color", "#FFFFFF", "important");
        (el as SVGElement).style.setProperty("fill", "none", "important");
      });
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(svg, { attributes: true, childList: true, subtree: true, attributeFilter: ["style", "stroke", "class"] });
    return () => mo.disconnect();
  });
  return ref;
};

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  const svgRef = useForceWhiteTickRef();
  return (
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
      <CheckboxPrimitive.Indicator className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Check
          ref={svgRef as unknown as React.Ref<SVGSVGElement>}
          className="!text-white !stroke-white allow-white"
          style={{ width: "82%", height: "82%" }}
          strokeWidth={3.4}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
