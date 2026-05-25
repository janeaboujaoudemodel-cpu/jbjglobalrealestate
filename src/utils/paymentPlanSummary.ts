/**
 * Standardised "Payment Plan" summary for card surfaces.
 *
 * Single source of truth for the rule:
 *   "If we have a usable payment plan signal, render a short summary.
 *    Otherwise render `N/A` so the cards stay vertically aligned."
 *
 * Used by <PaymentPlanLine /> on ProjectCard, ReellyProjectCard,
 * and FeaturedListings. Never invents numbers — only reads what the
 * row already carries (payment_breakdown JSON, payment_plan string).
 */

export const PAYMENT_PLAN_NA = "N/A";

interface PaymentMilestone {
  milestone?: string;
  percentage?: number | string | null;
  stage_type?: string | null;
}

interface LegacyBreakdown {
  down_payment?: string | number | null;
  during_construction?: string | number | null;
  on_completion?: string | number | null;
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Returns a concise 2-part plan label in the form `DP / REST`
 * (e.g. "10 / 90", "20 / 80") where REST = 100 − down-payment and
 * combines the during-construction + post-handover shares. The full
 * milestone-by-milestone breakdown is surfaced in the info popover —
 * the card row itself stays a clean two-number summary.
 *
 * Returns `null` when nothing usable is available; callers render
 * `PAYMENT_PLAN_NA` in that case.
 */
export const formatPaymentPlanSummary = (project: {
  payment_breakdown?: unknown;
  payment_plan?: string | null;
} | null | undefined): string | null => {
  if (!project) return null;

  const toTwoPart = (parts: number[]): string | null => {
    if (parts.length < 2) return null;
    const total = parts.reduce((s, n) => s + n, 0);
    if (total < 95 || total > 105) return null;
    const dp = Math.round(parts[0]);
    const rest = Math.max(0, Math.min(100, 100 - dp));
    return `${dp} / ${rest}`;
  };

  // 1. Direct string like "20/80" or "10 / 50 / 40" — keep first
  //    number as down-payment, collapse remainder into "rest".
  const planStr = project.payment_plan ? String(project.payment_plan).trim() : "";
  if (planStr) {
    const m = planStr.match(/\d{1,3}(?:\s*[\/\-]\s*\d{1,3}){1,3}/);
    if (m) {
      const nums = m[0]
        .split(/\s*[\/\-]\s*/)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n) && n >= 0);
      const collapsed = toTwoPart(nums);
      if (collapsed) return collapsed;
      // If totals don't add to ~100, still render DP / (100−DP) when DP is sane.
      if (nums.length >= 2 && nums[0] >= 0 && nums[0] <= 100) {
        return `${Math.round(nums[0])} / ${100 - Math.round(nums[0])}`;
      }
    }
  }

  const pb = project.payment_breakdown as
    | PaymentMilestone[]
    | LegacyBreakdown
    | null
    | undefined;

  // 2. Detailed milestone array
  if (Array.isArray(pb) && pb.length > 0) {
    const pcts = pb
      .map((m) => toNum(m?.percentage))
      .filter((n): n is number => n !== null);
    const collapsed = toTwoPart(pcts);
    if (collapsed) return collapsed;
  }

  // 3. Legacy object
  if (pb && !Array.isArray(pb) && typeof pb === "object") {
    const dp = toNum((pb as LegacyBreakdown).down_payment);
    const dc = toNum((pb as LegacyBreakdown).during_construction);
    const oc = toNum((pb as LegacyBreakdown).on_completion);
    const parts = [dp, dc, oc].filter((n): n is number => n !== null);
    const collapsed = toTwoPart(parts);
    if (collapsed) return collapsed;
  }

  return null;
};

