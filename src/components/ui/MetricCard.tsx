import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconTile } from "@/components/ui/icon-tile";

/**
 * MetricCard — the ONE canonical dashboard/KPI tile.
 * Layout is locked: IconTile (top-left, 40px emerald) · Number (display 32px, charcoal)
 * · Title (14px medium) · Subtitle (12px muted). Identical paddings + min-height.
 *
 * Use everywhere a metric/number tile is needed (Owner Dashboard, HR, CRM, AI Recruiting).
 * Do NOT roll a bespoke version — extend this with props if a variant is truly missing.
 */
export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
  hint?: React.ReactNode;
  trend?: React.ReactNode;
  loading?: boolean;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ icon, value, label, hint, trend, loading, className, ...rest }, ref) => (
    <div
      ref={ref}
      data-surface="champagne"
      data-jj-metric-card=""
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-[#B89555]/25 bg-[#F7F2EA] p-5",
        "min-h-[140px] shadow-[0_1px_2px_rgba(26,26,26,0.04)] transition-all duration-200",
        "hover:border-[#B89555]/55 hover:shadow-[0_8px_24px_-12px_rgba(6,78,59,0.25)]",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-3">
        <IconTile icon={icon} tone="emerald" size="md" />
        {trend ? <div className="text-xs font-medium text-[#064E3B]">{trend}</div> : null}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-[32px] leading-none font-semibold tracking-tight text-[#1A1A1A] tabular-nums">
          {loading ? <span className="inline-block h-7 w-16 rounded bg-[#EFE6D6] animate-pulse" /> : value}
        </div>
        <div className="text-sm font-medium text-[#1A1A1A]">{label}</div>
        {hint ? <div className="text-xs text-[#1A1A1A]/60">{hint}</div> : null}
      </div>
    </div>
  ),
);
MetricCard.displayName = "MetricCard";

export default MetricCard;
