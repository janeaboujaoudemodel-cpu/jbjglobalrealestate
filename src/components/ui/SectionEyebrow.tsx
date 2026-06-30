import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * SectionEyebrow — CANONICAL section label used site-wide.
 *
 * One pill, one size, one tone. Matches the careers hero label
 * ("CAREERS · JBJ GLOBAL REAL ESTATE") and "LIVE ROLES" badge.
 *
 * Style contract (locked):
 *   • Emerald metallic fill (.jj-pill-emerald-metallic)
 *   • White ink + white icon (data-no-contrast-guard)
 *   • Gold hairline border
 *   • 11px / 0.22em uppercase / font-bold
 *
 * Replace every per-page handcrafted eyebrow with this primitive.
 */
export interface SectionEyebrowProps {
  /** Optional leading icon (renders white, 12px). */
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  /** Label text. Will be rendered uppercase via tracking style. */
  children: ReactNode;
  /** Optional centering wrapper. Defaults to inline-flex. */
  className?: string;
  /** Render as a <div> (default) or other element. */
  as?: "div" | "span";
}

export function SectionEyebrow({
  icon: Icon,
  children,
  className,
  as: Tag = "div",
}: SectionEyebrowProps) {
  return (
    <Tag
      data-section-eyebrow
      data-surface="emerald"
      data-allow-dark-cta
      data-no-contrast-guard
      className={cn(
        "jj-cta-emerald jj-pill-emerald-metallic allow-white",
        "inline-flex items-center gap-2 rounded-full",
        "border border-[#B89555]/70",
        "px-3.5 py-1",
        "text-[11px] font-bold uppercase tracking-[0.22em]",
        "shadow-[0_4px_18px_-8px_rgba(6,78,59,0.45)]",
        className,
      )}
      style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
    >
      {Icon ? (
        <Icon
          className="w-3 h-3 allow-white"
          style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
        />
      ) : null}
      <span
        className="allow-white"
        style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
      >
        {children}
      </span>
    </Tag>
  );
}

export default SectionEyebrow;
