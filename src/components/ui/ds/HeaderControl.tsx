import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * HeaderControl — JBJ Design System (Phase 1.A)
 *
 * Single primitive for every horizontal header control:
 *   - circle  (44x44): Search, Filter, Heart, Avatar trigger
 *   - pill    (h-10):  AED currency, Mode chip, any compact CTA chip
 *   - segment (h-9):   sq ft / sq m segmented control
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
        circle: "jj-header-icon-control h-11 w-11 min-w-11 rounded-full p-0 text-base [&_svg]:w-4 [&_svg]:h-4",
        pill:   "h-10 min-w-[2.75rem] rounded-full px-4 text-[13px] [&_svg]:w-4 [&_svg]:h-4",
        segment:"h-9 min-w-[2.25rem] rounded-[10px] px-3 text-[12px] [&_svg]:w-[14px] [&_svg]:h-[14px]",
      },
      tone: {
        emerald:
          "text-white [color:#fff] shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)] hover:brightness-110 active:translate-y-0",
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

export interface HeaderControlProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof headerControl> {
  asChild?: never;
  "aria-label": string; // required for icon-only circles
}

export const HeaderControl = React.forwardRef<HTMLButtonElement, HeaderControlProps>(
  ({ className, shape, tone, active, style, children, ...props }, ref) => {
    const emerald = tone === "emerald" || tone === undefined;
    return (
      <button
        ref={ref}
        type="button"
        data-jjds-header-control=""
        data-jjds-shape={shape ?? "circle"}
        data-jjds-tone={tone ?? "emerald"}
        data-no-contrast-guard
        data-surface={emerald ? "emerald" : "light"}
        className={cn("allow-white", headerControl({ shape, tone, active }), className)}
        style={
          emerald
            ? {
                backgroundImage: "var(--jj-emerald-ombre)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                ...style,
              }
            : style
        }
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
 * Renders two HeaderControl segment buttons inside a champagne shell.
 */
export interface HeaderSegmentedProps {
  value: string;
  options: { value: string; label: React.ReactNode; "aria-label"?: string }[];
  onChange: (v: string) => void;
  className?: string;
}
export function HeaderSegmented({ value, options, onChange, className }: HeaderSegmentedProps) {
  return (
    <div
      data-jjds-segmented=""
      data-no-contrast-guard
      data-on-dark
      data-allow-dark-cta
      data-jj-utility-pill
      className={cn(
        "allow-white inline-flex items-center h-9 rounded-full overflow-hidden relative shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)]",
        className,
      )}
      style={{ backgroundImage: "var(--jj-emerald-ombre)", border: "1px solid rgba(255,255,255,0.18)" }}
    >
      {options.map((opt, index) => {
        const isActive = opt.value === value;
        return (
          <React.Fragment key={opt.value}>
            {index > 0 && <span aria-hidden className="w-px h-4 bg-white/25" />}
            <button
              type="button"
              data-no-contrast-guard
              data-active={isActive}
              data-on-dark
              data-allow-dark-cta
              className="allow-white jj-sqtoggle relative px-3 h-full text-[11px] font-bold tracking-wide transition-all duration-300"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              aria-label={opt["aria-label"] ?? String(opt.label)}
              aria-pressed={isActive}
              onClick={() => onChange(opt.value)}
            >
              <span aria-hidden="true" className="jj-sqtoggle-sweep" />
              <span>{opt.label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default HeaderControl;
