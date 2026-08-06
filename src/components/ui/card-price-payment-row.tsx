/**
 * CardPricePaymentRow — Reelly-style bottom row for property cards.
 *
 *   Price from                Payment plan ⓘ
 *   1,250,000 AED             60 / 40
 *
 * Left column = "From" eyebrow + dark price value.
 * price-pill tokens). Right column = "Payment Plan" eyebrow + plan summary
 * with an emerald info popover showing the milestone breakdown on
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
import { useCurrency } from "@/hooks/useCurrency";


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

const DEFAULT_LABELS = ["Down payment", "During construction", "On completion"];
const SUMMARY_LABELS = ["During construction", "On completion"];

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
    if (oc !== null) parts.push({ label: "On completion", value: `${Math.round(oc)}%` });
    if (parts.length >= 2) return parts;
  }

  const planStr = project.payment_plan ? String(project.payment_plan).trim() : "";
  if (planStr) {
    const tokens = planStr.split(/[/|+\-–—]/).map((t) => t.trim()).filter(Boolean);
    const nums = tokens
      .map((t) => Number(t.replace(/[^\d.]/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);
    const total = nums.reduce((sum, n) => sum + n, 0);
    if (tokens.length === nums.length && nums.length >= 2 && total >= 95 && total <= 105) {
      const labels = nums.length === 2 ? SUMMARY_LABELS : DEFAULT_LABELS;
      return nums.map((n, i) => ({
        label: labels[i] ?? `Stage ${i + 1}`,
        value: `${Math.round(n)}%`,
      }));
    }
  }

  // Fallback: derive from summary string ("20 / 80", "10 / 50 / 40")
  const summary = formatPaymentPlanSummary(project);
  if (summary) {
    const pcts = summary.split("/").map((s) => s.trim());
    if (pcts.length >= 2) {
      const labels = pcts.length === 2 ? SUMMARY_LABELS : DEFAULT_LABELS;
      return pcts.map((v, i) => ({
        label: labels[i] ?? `Stage ${i + 1}`,
        value: v.endsWith("%") ? v : `${v}%`,
      }));
    }
  }

  return null;
}

export const CardPricePaymentRow: React.FC<CardPricePaymentRowProps> = ({
  price,
  currency: _currency = "AED",
  project,
  className,
}) => {
  const [isPlanOpen, setIsPlanOpen] = React.useState(false);
  const { formatPriceFull } = useCurrency();
  const hasPrice = typeof price === "number" && price > 0;
  const summary = formatPaymentPlanSummary(project);
  const breakdown = getBreakdownRows(project);
  const hasPlan = Boolean(summary);


  return (
    <div
      data-card-price-payment-row
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 min-w-0 min-h-[3.75rem]",
        className,
      )}
    >

      {/* LEFT — Price from */}
      <div className="flex min-w-0 flex-col justify-end">
        <span data-area-price-label className="text-[10px] uppercase tracking-[0.14em] font-medium leading-none" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>
          Price from
        </span>
        <span
          data-no-contrast-guard
          style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
          className={cn(
            "mt-1 font-semibold tabular-nums leading-tight whitespace-nowrap",
            "text-[15px] sm:text-base",
          )}
        >
          {hasPrice ? formatPriceFull(price!) : "On request"}
        </span>
      </div>

      {hasPlan && breakdown && breakdown.length > 0 && (
      <div className="flex min-w-[5.75rem] flex-col items-end justify-end text-right">
        <span data-area-price-label className="text-[10px] uppercase tracking-[0.14em] font-medium leading-none" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>
          Payment Plan
        </span>
         <div className="mt-1 flex min-h-5 items-center justify-end gap-1.5 whitespace-nowrap">
          <span
            className={cn(
              "font-semibold tabular-nums leading-tight text-[#1A1A1A]",
              "text-[15px] sm:text-base",
            )}
          >
            {summary}
          </span>
            <Popover open={isPlanOpen} onOpenChange={setIsPlanOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPlanOpen((open) => !open);
                  }}
                  aria-label="View payment plan breakdown"
                  aria-expanded={isPlanOpen}
                  className={cn(
                    // Fixed square box + aspect-square + shrink-0 so flex can
                    // never stretch it into a vertical oval.
                    "inline-flex self-center shrink-0 grow-0 basis-auto aspect-square h-[22px] max-h-[22px] min-h-[22px] w-[22px] p-0 leading-none",
                    "items-center justify-center rounded-full",
                    "text-[#064E3B]/75 hover:text-[#064E3B]",
                    // Elegant hover: no beige blob — a hairline emerald ring
                    // with a whisper-soft tint.
                    "bg-transparent ring-0 hover:bg-[#064E3B]/[0.06] hover:ring-1 hover:ring-[#064E3B]/35",
                    "transition-[color,background-color,box-shadow] duration-200",
                    "focus:outline-none focus-visible:ring-1 focus-visible:ring-[#064E3B]/60",
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
                  "bg-[#FDFBF7] border border-[#064E3B]/45",
                  "shadow-[0_18px_50px_rgba(0,0,0,0.18)] rounded-xl",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3.5 py-2.5 border-b border-[#064E3B]/30 bg-[#F7F2EA]">
                  <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#1A1A1A]">
                    Payment plan {summary ? `· ${summary}` : ""}
                  </span>
                </div>
                <ul className="divide-y divide-[#064E3B]/15">
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
        </div>
      </div>
      )}

    </div>
  );
};

export default CardPricePaymentRow;
