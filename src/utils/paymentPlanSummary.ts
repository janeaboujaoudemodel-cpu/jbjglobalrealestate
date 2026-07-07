/**
 * Standardised "Payment Plan" summary for card surfaces.
 *
 * SAFETY RULE (legal): We NEVER parse a free-text `payment_plan` string into
 * booking/construction/handover percentages, because strings like "10/90" or
 * "90/10" are ambiguous (10 booking + 90 post-handover vs. 90 construction +
 * 10 on handover, etc.). Misrepresenting a developer's plan can put us in
 * legal trouble.
 *
 * We only return a numeric summary when the authoritative structured
 * `payment_breakdown` array (or legacy object) is present and verifiably
 * sums to ~100%. Otherwise:
 *   - if `payment_plan` text exists, we return that text trimmed verbatim
 *   - otherwise null → caller renders PAYMENT_PLAN_NA
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

const cleanVisiblePlanText = (value: string): string =>
  value.replace(/handover/gi, "completion");

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export const formatPaymentPlanSummary = (project: {
  payment_breakdown?: unknown;
  payment_plan?: string | null;
} | null | undefined): string | null => {
  if (!project) return null;

  const pb = project.payment_breakdown as
    | PaymentMilestone[]
    | LegacyBreakdown
    | null
    | undefined;

  // 1. Authoritative milestone array — sum must validate to ~100%.
  //    Rule: LAST milestone = on-completion %. Everything before = pre-completion.
  //    Display as "<pre> / <onCompletion>" (e.g. 20+40+40 → "60 / 40").
  if (Array.isArray(pb) && pb.length >= 2) {
    const pcts = pb
      .map((m) => toNum(m?.percentage))
      .filter((n): n is number => n !== null);
    if (pcts.length >= 2) {
      const total = pcts.reduce((s, n) => s + n, 0);
      if (total >= 95 && total <= 105) {
        const onCompletion = Math.round(pcts[pcts.length - 1]);
        const pre = Math.max(0, Math.min(100, 100 - onCompletion));
        return `${pre} / ${onCompletion}`;
      }
    }
  }

  // 2. Legacy object — needs at least down_payment + on_completion to be safe
  if (pb && !Array.isArray(pb) && typeof pb === "object") {
    const dp = toNum((pb as LegacyBreakdown).down_payment);
    const dc = toNum((pb as LegacyBreakdown).during_construction);
    const oc = toNum((pb as LegacyBreakdown).on_completion);
    const parts = [dp, dc, oc].filter((n): n is number => n !== null);
    if (parts.length >= 2) {
      const total = parts.reduce((s, n) => s + n, 0);
      if (total >= 95 && total <= 105 && oc !== null) {
        const onCompletion = Math.round(oc);
        const pre = Math.max(0, Math.min(100, 100 - onCompletion));
        return `${pre} / ${onCompletion}`;
      }
    }
  }


  // 3. Free-text payment_plan — detect a leading numeric ratio like
  //    "70/30", "60 / 40", "10/50/40", or "70/30 with 3-Year Post-handover"
  //    and normalise to pre-completion / on-completion. Otherwise verbatim.
  const planStr = project.payment_plan ? String(project.payment_plan).trim() : "";
  if (planStr) {
    // Match leading N[/N]+ ratio pattern (ignores trailing descriptive text)
    const ratioMatch = planStr.match(/^\s*(\d{1,3}(?:\s*[\/|+\-–—]\s*\d{1,3}){1,4})/);
    if (ratioMatch) {
      const nums = ratioMatch[1]
        .split(/[\/|+\-–—]/)
        .map((t) => Number(t.trim()))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (nums.length >= 2) {
        const total = nums.reduce((s, n) => s + n, 0);
        if (total >= 95 && total <= 105) {
          const onCompletion = Math.round(nums[nums.length - 1]);
          const pre = Math.max(0, Math.min(100, 100 - onCompletion));
          return `${pre} / ${onCompletion}`;
        }
      }
    }
    return cleanVisiblePlanText(planStr);
  }


  return null;
};
