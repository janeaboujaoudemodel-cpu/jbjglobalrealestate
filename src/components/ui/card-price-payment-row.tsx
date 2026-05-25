/**
 * CardPricePaymentRow — Reelly-style bottom row for property cards.
 *
 *   Price from                Payment plan ⓘ
 *   1,250,000 AED             60 / 40
 *
 * Left column = "From" eyebrow + orange price value (uses --price-orange via
 * price-pill tokens). Right column = "Payment Plan" eyebrow + plan summary
 * with a champagne info popover showing the milestone breakdown on
 * hover/click. Responsive: two columns scale gracefully on mobile.
 */

import * as React from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatPaymentPlanSummary,
  PAYMENT_PLAN_NA,
} from "@/utils/paymentPlanSummary";
import { cn } from "@/lib/utils";

const SYMBOLS: Record<string, string> = {
  AED: "AED", USD: "$", EUR: "€", GBP: "£", INR: "₹",
  SAR: "SAR", CNY: "¥", RUB: "₽", CAD: "C$", AUD: "A$",
};
const RATES: Record<string, number> = {
  AED: 1, USD: 0.27, EUR: 0.25, GBP: 0.21, INR: 22.5,
  SAR: 1.02, CNY: 1.98, RUB: 24.5, CAD: 0.37, AUD: 0.42,
};

function formatPrice(price: number, currency: string): string {
  const converted = price * (RATES[currency] ?? 1);
  const sym = SYMBOLS[currency] ?? currency;
  if (converted >= 1_000_000) {
    const m = converted / 1_000_000;
    return `${sym} ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(2)}M`;
  }
  if (converted >= 1_000) return `${sym} ${Math.round(converted / 1_000)}K`;
  return `${sym} ${Math.round(converted).toLocaleString()}`;
}

interface Milestone {
  milestone?: string;
  stage_type?: string | null;
  percentage?: number | string | null;
}

interface CardPricePaymentRowProps {
  price?: number | null;
  currency?: string;
  project: {
    payment_breakdown?: unknown;
    payment_plan?: string | null;
  } | null | undefined;
  className?: string;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const DEFAULT_LABELS = ["Down payment", "During construction", "Post handover"];

function getBreakdownRows(
  project: CardPricePaymentRowProps["project"],
): { label: string; value: string }[] | null {
  if (!project) return null;
  const pb = project.payment_breakdown;

  if (Array.isArray(pb) && pb.length > 0) {
    const rows = (pb as Milestone[])
      .map((m, i) => {
        const pct = toNum(m?.percentage);
        if (pct === null) return null;
        const label =
          (m?.milestone || m?.stage_type || DEFAULT_LABELS[i] || `Milestone ${i + 1}`).toString();
        return { label, value: `${Math.round(pct)}%` };
      })
      .filter(Boolean) as { label: string; value: string }[];
    if (rows.length >= 2) return rows;
  }

  if (pb && !Array.isArray(pb) && typeof pb === "object") {
    const obj = pb as Record<string, unknown>;
    const dp = toNum(obj.down_payment);
    const dc = toNum(obj.during_construction);
    const oc = toNum(obj.on_completion ?? obj.post_handover);
    const parts: { label: string; value: string }[] = [];
    if (dp !== null) parts.push({ label: "Down payment", value: `${Math.round(dp)}%` });
    if (dc !== null) parts.push({ label: "During construction", value: `${Math.round(dc)}%` });
    if (oc !== null) parts.push({ label: "Post handover", value: `${Math.round(oc)}%` });
    if (parts.length >= 2) return parts;
  }

  // Fallback: derive from summary string ("20 / 80", "10 / 50 / 40")
  const summary = formatPaymentPlanSummary(project);
  if (summary) {
    const pcts = summary.split("/").map((s) => s.trim());
    if (pcts.length >= 2) {
      return pcts.map((v, i) => ({
        label: DEFAULT_LABELS[i] ?? `Stage ${i + 1}`,
        value: v.endsWith("%") ? v : `${v}%`,
      }));
    }
  }

  return null;
}

export const CardPricePaymentRow: React.FC<CardPricePaymentRowProps> = ({
  price,
  currency = "AED",
  project,
  className,
}) => {
  const hasPrice = typeof price === "number" && price > 0;
  const summary = formatPaymentPlanSummary(project);
  const breakdown = getBreakdownRows(project);
  const hasPlan = Boolean(summary);

  return (
    <div
      data-card-price-payment-row
      className={cn(
        "flex items-end justify-between gap-3 min-w-0",
        className,
      )}
    >
      {/* LEFT — Price from */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-[#1A1A1A]/65 leading-none">
          Price from
        </span>
        <span
          className={cn(
            "mt-1 font-semibold tabular-nums leading-tight truncate",
            "text-[15px] sm:text-base",
            hasPrice ? "text-[hsl(var(--price-orange))]" : "text-[#1A1A1A]/70",
          )}
        >
          {hasPrice ? formatPrice(price!, currency) : "On request"}
        </span>
      </div>

      {/* RIGHT — Payment plan + info popover.
          Hidden entirely when the plan is unknown — never render "N/A".
          The price column simply sits alone on the row in that case. */}
      {hasPlan && (
        <div className="flex flex-col items-end min-w-0">
          <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-[#1A1A1A]/65 leading-none">
            Payment plan
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                "font-semibold tabular-nums leading-tight text-[#1A1A1A]",
                "text-[15px] sm:text-base",
              )}
            >
              {summary}
            </span>
            {breakdown && breakdown.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    aria-label="View payment plan breakdown"
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full",
                      "text-[#1A1A1A]/70 hover:text-[#1A1A1A]",
                      "hover:bg-[#EFE6D6] transition-colors",
                      "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#B89555]/60",
                    )}
                    data-no-contrast-guard
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="top"
                  sideOffset={6}
                  className={cn(
                    "w-60 p-0 overflow-hidden",
                    "bg-[#FDFBF7] border border-[#B89555]/45",
                    "shadow-[0_18px_50px_rgba(0,0,0,0.18)] rounded-xl",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3.5 py-2.5 border-b border-[#B89555]/30 bg-[#F7F2EA]">
                    <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#1A1A1A]">
                      Payment plan breakdown
                    </span>
                  </div>
                  <ul className="divide-y divide-[#B89555]/15">
                    {breakdown.map((row, i) => (
                      <li
                        key={`${row.label}-${i}`}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5"
                      >
                        <span className="text-[13px] text-[#1A1A1A]/85 truncate">
                          {row.label}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums text-[#1A1A1A]">
                          {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardPricePaymentRow;
