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
 * Returns either a concise plan label (e.g. "20 / 80", "10 / 50 / 40")
 * or `null` when nothing usable is available. Callers should render
 * `PAYMENT_PLAN_NA` for the null case.
 */
export const formatPaymentPlanSummary = (project: {
  payment_breakdown?: unknown;
  payment_plan?: string | null;
} | null | undefined): string | null => {
  if (!project) return null;

  // 1. Direct string like "20/80" or "10 / 50 / 40"
  const planStr = project.payment_plan ? String(project.payment_plan).trim() : "";
  if (planStr) {
    const m = planStr.match(/\d{1,3}(?:\s*[\/\-]\s*\d{1,3}){1,3}/);
    if (m) return m[0].replace(/\s*[\/\-]\s*/g, " / ");
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
    const total = pcts.reduce((s, n) => s + n, 0);
    if (pcts.length >= 2 && total >= 95 && total <= 105) {
      return pcts.map((n) => Math.round(n)).join(" / ");
    }
  }

  // 3. Legacy object
  if (pb && !Array.isArray(pb) && typeof pb === "object") {
    const dp = toNum((pb as LegacyBreakdown).down_payment);
    const dc = toNum((pb as LegacyBreakdown).during_construction);
    const oc = toNum((pb as LegacyBreakdown).on_completion);
    const parts = [dp, dc, oc].filter((n): n is number => n !== null);
    const total = parts.reduce((s, n) => s + n, 0);
    if (parts.length >= 2 && total >= 95 && total <= 105) {
      return parts.map((n) => Math.round(n)).join(" / ");
    }
  }

  return null;
};
