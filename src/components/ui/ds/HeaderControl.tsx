import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * HeaderControl — JBJ Design System (Phase 1.A)
 *
 * Single primitive for every horizontal header control:
 *   - circle  (44x44): Search, Filter, Heart, Avatar trigger
 *   - pill    (44px):  AED currency, Mode chip, any compact CTA chip
 *   - segment (44px):  sq ft / sq m segmented control
 *
 * Contract:
 *   - tone="emerald" → emerald metallic surface, white fg/icons (locked)
 *   - tone="champagne" → champagne surface, ink fg, gold hairline
 *   - tone="ghost"    → transparent, inherits surface contrast
 *
 * All sizes lock min-w/min-h so labels and icons never crop.
 * Opt-out of the universal contrast guard via [data-no-contrast-guard]
 * because this primitive owns its own contrast contract.
 */

const headerControl = cva(
  // base
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold tracking-[0.01em] leading-none whitespace-nowrap",
    "transition-[transform,box-shadow,filter,background-color] duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#047857] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
    "shrink-0 select-none",
  ].join(" "),
  {
    variants: {
      shape: {
        circle: "jj-header-icon-control h-10 w-10 min-w-10 rounded-full p-0 text-base [&_svg]:w-4 [&_svg]:h-4",
        pill:   "jj-header-selector-control h-10 min-w-10 rounded-full px-3.5 text-[12px] [&_svg]:w-4 [&_svg]:h-4",
        segment:"h-10 min-w-10 rounded-full px-2.5 text-[11px] [&_svg]:w-[14px] [&_svg]:h-[14px]",
      },
      tone: {
        emerald:
          "text-white [color:#fff] shadow-[0_10px_24px_-14px_rgba(6,78,59,0.92)] hover:brightness-110 active:translate-y-0",
        champagne:
          "text-[#1A1A1A] bg-[#F7F2EA] border border-[#B89555]/40 hover:bg-[#EFE6D6] hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "text-[#1A1A1A] bg-transparent hover:bg-[#1A1A1A]/[0.04]",
      },
      active: {
        true: "ring-2 ring-[#047857]/35",
        false: "",
      },
    },
    compoundVariants: [
      // Emerald metallic background applied via inline style (no Tailwind arbitrary value
      // collisions with the global emerald lock). Done in component below.
    ],
    defaultVariants: {
      shape: "circle",
      tone: "emerald",
      active: false,
    },
  },
);

export type { ControlSkin } from "@/hooks/use-chrome-skin";
import { useControlSkin, useInkLock, inkForSkin, paintInk, type ControlSkin } from "@/hooks/use-chrome-skin";


const CHAMPAGNE_SURFACE: React.CSSProperties = {
  backgroundImage: "linear-gradient(90deg, #FDFBF7 0%, #F7F2EA 52%, #F2EBDC 100%)",
  border: "1px solid rgba(184,149,85,0.42)",
  boxShadow: "0 1px 2px rgba(26,26,26,0.08)",
  color: "#1A1A1A",
  WebkitTextFillColor: "#1A1A1A",
};

const EMERALD_SURFACE: React.CSSProperties = {
  backgroundImage: "var(--jj-emerald-ombre)",
  border: "0",
  boxShadow: "0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)",
  color: "#FFFFFF",
  WebkitTextFillColor: "#FFFFFF",
};

export interface HeaderControlProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof headerControl> {
  asChild?: never;
  "aria-label": string; // required for icon-only circles
}

export const HeaderControl = React.forwardRef<HTMLButtonElement, HeaderControlProps>(
  ({ className, shape, tone, active, style, children, ...props }, ref) => {
    const emerald = tone === "emerald" || tone === undefined;
    const skin = useControlSkin();
    const skinned = emerald && skin !== "clear"
      ? { ...(skin === "champagne" ? CHAMPAGNE_SURFACE : EMERALD_SURFACE), ...style }
      : style;
    const ink = inkForSkin(skin);
    const innerRef = React.useRef<HTMLButtonElement | null>(null);
    React.useEffect(() => {
      const run = () => paintInk(innerRef.current, ink);
      run();
      const id = window.setTimeout(run, 60);
      return () => window.clearTimeout(id);
    });
    return (
      <button
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        type="button"
        data-jjds-header-control=""
        data-jjds-shape={shape ?? "circle"}
        data-jjds-tone={tone ?? "emerald"}
        data-jjds-skin={emerald ? skin : "light"}
        data-no-contrast-guard
        data-surface={emerald && skin === "emerald" ? "emerald" : "light"}
        className={cn("allow-white jj-header-premium-control", headerControl({ shape, tone, active }), className)}
        style={skinned}
        {...props}
      >
        {children}
      </button>
    );
  },
);

HeaderControl.displayName = "HeaderControl";


/**
 * HeaderSegmented — paired segment control (e.g. sq ft / sq m).
 * Uses the same 44px emerald control family as AED and Mode.
 */
export interface HeaderSegmentedProps {
  value: string;
  options: { value: string; label: React.ReactNode; "aria-label"?: string }[];
  onChange: (v: string) => void;
  className?: string;
}
export function HeaderSegmented({ value, options, onChange, className }: HeaderSegmentedProps) {
  const skin = useControlSkin();
  const champagne = skin === "champagne";
  const ink = champagne ? "#1A1A1A" : "#FFFFFF";
  const groupRef = useInkLock<HTMLDivElement>(ink);

  const groupStyle: React.CSSProperties =
    skin === "clear"
      ? {}
      : champagne
        ? {
            backgroundImage: "linear-gradient(90deg, #FDFBF7 0%, #F7F2EA 52%, #F2EBDC 100%)",
            border: "1px solid rgba(184,149,85,0.42)",
            boxShadow: "0 1px 2px rgba(26,26,26,0.08)",
          }
        : {
            backgroundImage: "var(--jj-emerald-ombre)",
            border: 0,
            boxShadow: "0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)",
          };
  return (
    <div
      data-jjds-segmented=""
      data-jjds-skin={skin}
      data-no-contrast-guard
      data-on-dark={skin !== "champagne" ? "" : undefined}
      data-allow-dark-cta
      data-jj-utility-pill
      data-header-control-family="segmented"
      data-surface={champagne ? "champagne" : undefined}
      className={cn(
        champagne ? "jj-header-premium-control" : "allow-white jj-header-premium-control",
        "inline-flex items-center h-10 rounded-full overflow-hidden relative",
        !champagne && "shadow-[0_10px_24px_-14px_rgba(6,78,59,0.92)]",
        className,
      )}
      style={groupStyle}
    >
      {options.map((opt, index) => {
        const isActive = opt.value === value;
        return (
          <React.Fragment key={opt.value}>
            {index > 0 && (
              <span aria-hidden className={cn("w-px h-5", champagne ? "bg-[#B89555]/35" : "bg-white/20")} />
            )}
            <button
              type="button"
              data-no-contrast-guard
              data-active={isActive}
              data-jjds-skin={skin}
              data-on-dark={skin !== "champagne" ? "" : undefined}
              data-allow-dark-cta
              data-surface={champagne ? "champagne" : undefined}
              className={cn(
                // On champagne the button is a LIGHT surface: no allow-white opt-in,
                // so the global white-ink guards never claim it.
                champagne ? "jj-sqtoggle" : "allow-white jj-sqtoggle",
                "relative px-3 h-full text-[11px] font-bold tracking-wide transition-all duration-200",
                isActive && !champagne && "jj-emerald-metallic",
              )}
              style={
                champagne
                  ? {
                      color: ink,
                      WebkitTextFillColor: ink,
                      backgroundImage: isActive
                        ? "linear-gradient(180deg, #F0E5CF 0%, #E7D9BD 100%)"
                        : "none",
                      boxShadow: isActive ? "inset 0 0 0 1px rgba(184,149,85,0.5)" : "none",
                    }
                  : { color: ink, WebkitTextFillColor: ink }
              }
              aria-label={opt["aria-label"] ?? String(opt.label)}
              aria-pressed={isActive}
              onClick={() => onChange(opt.value)}
            >
              {!champagne && <span aria-hidden="true" className="jj-sqtoggle-sweep" />}
              <span>{opt.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}


export default HeaderControl;
