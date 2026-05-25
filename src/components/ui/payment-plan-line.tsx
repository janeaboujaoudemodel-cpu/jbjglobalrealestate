import * as React from "react";
import { cn } from "@/lib/utils";
import { formatPaymentPlanSummary } from "@/utils/paymentPlanSummary";

/**
 * <PaymentPlanLine /> — standardised meta row for project/property cards.
 *
 * When the project has a real payment plan, renders a fixed-height ink
 * line so cards stay vertically aligned. When the plan is unknown, the
 * component renders NOTHING — we never show "N/A" or "TBA" on cards.
 *
 * Visual identity matches the other ink meta rows on cards: ink #1A1A1A,
 * Inter, small caps label + tabular value. No gold fills, no raw grays.
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
  if (!summary) return null;

  return (
    <div
      ref={ref}
      className={cn("flex items-baseline gap-1.5 min-h-[22px]", className)}
      data-payment-plan-line
      {...props}
    >
      <span className="text-[10px] uppercase tracking-[0.14em] font-medium text-[#1A1A1A]/70">
        Payment Plan
      </span>
      <span
        className="font-semibold text-sm tabular-nums text-[#1A1A1A]"
        aria-label={`Payment plan ${summary}`}
      >
        {summary}
      </span>
    </div>
  );
});

PaymentPlanLine.displayName = "PaymentPlanLine";
