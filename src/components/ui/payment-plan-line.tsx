import * as React from "react";
import { cn } from "@/lib/utils";
import {
  formatPaymentPlanSummary,
  PAYMENT_PLAN_NA,
} from "@/utils/paymentPlanSummary";

/**
 * <PaymentPlanLine /> — standardised meta row for project/property cards.
 *
 * Always renders a fixed-height line so cards stay vertically aligned
 * regardless of whether payment breakdown data is present. Falls back
 * to `N/A` (never blank, never "TBA") per the unified card rule.
 *
 * Visual identity matches the other ink meta rows on cards: ink #1A1A1A,
 * Inter, small caps label + tabular value. Uses no gold fills and no
 * raw grays (per Core memory).
 */
export interface PaymentPlanLineProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  project: {
    payment_breakdown?: unknown;
    payment_plan?: string | null;
  } | null | undefined;
}

export const PaymentPlanLine = React.forwardRef<
  HTMLDivElement,
  PaymentPlanLineProps
>(({ project, className, ...props }, ref) => {
  const summary = formatPaymentPlanSummary(project);
  const value = summary ?? PAYMENT_PLAN_NA;
  const isNa = summary === null;

  return (
    <div
      ref={ref}
      className={cn(
        // Fixed min-height keeps card grids aligned across rows.
        "flex items-baseline gap-1.5 min-h-[22px]",
        className,
      )}
      data-payment-plan-line
      {...props}
    >
      <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-[#1A1A1A]/70">
        Payment Plan
      </span>
      <span
        className={cn(
          "font-semibold text-sm tabular-nums",
          isNa ? "text-[#1A1A1A]/70" : "text-[#1A1A1A]",
        )}
        aria-label={isNa ? "Payment plan not available" : `Payment plan ${value}`}
      >
        {value}
      </span>
    </div>
  );
});

PaymentPlanLine.displayName = "PaymentPlanLine";
