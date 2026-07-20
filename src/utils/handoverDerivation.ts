/**
 * Best-effort handover derivation.
 *
 * Used by property/project cards to avoid showing "TBA" / "To be announced"
 * whenever any usable signal exists in the row. Resolution order:
 *
 *  1. Direct fields: handover_date, handover, completion_date,
 *     expected_completion, handover_quarter.
 *  2. Regex `Q1–Q4 YYYY` from description / payment text / status fields.
 *  3. Earliest bare year in those same fields.
 *  4. null — caller renders "Handover — coming soon" (premium fallback,
 *     never "TBA" / "To be announced").
 *
 * We never invent a date and we never convert a stale/past date into
 * “Ready”. A completion claim must be explicitly stored as a verified
 * construction status; otherwise the exact stored date/quarter is displayed.
 * We never call out to external developer websites
 * at render time (CORS / referrer leak / grid latency). The listing
 * enrichment edge function is responsible for persisting derived dates back
 * onto the row so the cards eventually show real data.
 */
export const deriveHandover = (p: any): string | null => {
  if (!p) return null;

  // Only an explicit construction-status field can claim a project is ready.
  // Card components may still suppress this word on public listing grids.
  const cs = p.construction_status ? String(p.construction_status) : "";
  if (/ready|complet|handed.?over/i.test(cs)) return "Ready";

  const direct =
    p.handover_date ??
    p.handover ??
    p.completion_date ??
    p.expected_completion ??
    p.handover_quarter ??
    null;
  if (direct && String(direct).trim()) {
    const value = String(direct).trim();
    if (/^ready$/i.test(value)) return "Ready";
    return value;
  }

  const haystacks: string[] = [
    p.description,
    p.payment_breakdown,
    p.payment_plan,
    p.status_label,
    p.construction_status,
  ]
    .filter(Boolean)
    .map((v) => (typeof v === "string" ? v : JSON.stringify(v)));

  // Q1/Q2/Q3/Q4 + YYYY
  for (const h of haystacks) {
    const q = h.match(/Q\s?([1-4])\s*[\/\-\s]?\s*(20\d{2})/i);
    if (q) return `Q${q[1]} ${q[2]}`;
  }

  // Earliest bare year. Do not discard past/stale dates by converting them
  // into "Ready"; the owner must explicitly verify completion first.
  for (const h of haystacks) {
    const yrs = h.match(/(20\d{2})/g);
    if (yrs) {
      const year = yrs
        .map(Number)
        .sort((a, b) => a - b)[0];
      if (year) return String(year);
    }
  }

  return null;
};

/** Premium fallback label — never "TBA" / "To be announced". */
export const HANDOVER_FALLBACK = "Coming soon";
