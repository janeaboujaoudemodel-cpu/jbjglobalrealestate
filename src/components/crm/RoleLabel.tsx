import * as React from "react";
import { Crown, User, Briefcase, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * RoleLabel — single primitive for Crown / Owner / Investor / Broker /
 * Developer labels across the back office.
 *
 * Two tones only:
 *  - emerald  → filled emerald ombre, pure white text + icon (active/owner pill)
 *  - champagne → transparent surface, GOLD text, EMERALD icon, NO border, NO chip
 *
 * Pages must NOT wrap this in another bordered chip. The CSS contract in
 * index.css strips any wrapping bg/border/box-shadow around a `[data-bk-role-label]`.
 */

export type RoleKind = "owner" | "investor" | "broker" | "developer" | "admin" | "vip";

const ICONS: Record<RoleKind, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  owner: Crown,
  vip: Crown,
  admin: Shield,
  investor: User,
  broker: Briefcase,
  developer: Building2,
};

const LABELS: Record<RoleKind, string> = {
  owner: "Owner",
  vip: "VIP",
  admin: "Admin",
  investor: "Investor",
  broker: "Broker",
  developer: "Developer",
};

export interface RoleLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: RoleKind;
  tone?: "emerald" | "champagne";
  /** Override the visible label text (defaults to role title). */
  label?: string;
  /** Hide the leading icon. */
  iconOnly?: boolean;
  /** Hide the icon entirely. */
  noIcon?: boolean;
  size?: "sm" | "md";
}

export const RoleLabel = React.forwardRef<HTMLSpanElement, RoleLabelProps>(
  ({ role, tone = "champagne", label, iconOnly, noIcon, size = "md", className, ...rest }, ref) => {
    const Icon = ICONS[role];
    const text = label ?? LABELS[role];
    const sizeText = size === "sm" ? "text-[11px]" : "text-xs";
    const iconBox = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

    if (tone === "emerald") {
      return (
        <span
          ref={ref}
          data-bk-role-label={role}
          data-bk-surface="emerald"
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold uppercase tracking-[0.08em]",
            sizeText,
            // Emerald fill comes from the existing dark emerald ombre via class
            "jj-emerald-action",
            className,
          )}
          {...rest}
        >
          {!noIcon && Icon && <Icon className={iconBox} />}
          {!iconOnly && <span>{text}</span>}
        </span>
      );
    }

    // CHAMPAGNE TONE — bare: gold label, emerald glyph, no frame.
    return (
      <span
        ref={ref}
        data-bk-role-label={role}
        data-bk-surface="champagne"
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.10em]",
          sizeText,
          className,
        )}
        style={{ color: "var(--bk-gold, #B89555)" }}
        {...rest}
      >
        {!noIcon && Icon && (
          <Icon
            className={iconBox}
            style={{ color: "var(--bk-emerald, #064E3B)" }}
          />
        )}
        {!iconOnly && <span>{text}</span>}
      </span>
    );
  },
);
RoleLabel.displayName = "RoleLabel";

export default RoleLabel;
