/**
 * Mortgage eligibility rule — locked platform-wide.
 *
 * RULE:
 *  - Ready / completed projects: mortgage always available.
 *  - Off-plan from a Tier-1 listed developer (Emaar, DAMAC, Sobha, Nakheel,
 *    Aldar, Meraas, Dubai Properties, Dubai Holding, Omniyat): mortgage
 *    becomes available once construction progress reaches 50%.
 *  - All other off-plan projects: NOT eligible (banks generally will not
 *    finance pre-handover).
 *
 * The helper is intentionally conservative — when unsure, return false.
 */

const TIER_1_DEVELOPERS = new Set([
  "emaar",
  "emaar properties",
  "damac",
  "damac properties",
  "sobha",
  "sobha realty",
  "nakheel",
  "aldar",
  "aldar properties",
  "meraas",
  "dubai properties",
  "dubai holding",
  "omniyat",
]);

const READY_STATUSES = new Set([
  "ready",
  "completed",
  "handed_over",
  "handed over",
  "delivered",
]);

const OFFPLAN_STATUSES = new Set([
  "off_plan",
  "offplan",
  "off-plan",
  "under_construction",
  "under construction",
  "pre-launch",
  "prelaunch",
  "launching_soon",
]);

export interface MortgageEligibilityInput {
  sale_status?: string | null;
  construction_status?: string | null;
  status_label?: string | null;
  construction_progress?: number | null;
  developer_name?: string | null;
  developer?: { name?: string | null } | null;
}

function norm(v?: string | null) {
  return (v || "").toString().trim().toLowerCase();
}

export function isReady(p: MortgageEligibilityInput): boolean {
  const s = [p.sale_status, p.construction_status, p.status_label].map(norm);
  return s.some((x) => READY_STATUSES.has(x) || x.includes("ready") || x.includes("completed"));
}

export function isOffPlan(p: MortgageEligibilityInput): boolean {
  const s = [p.sale_status, p.construction_status, p.status_label].map(norm);
  return s.some((x) => OFFPLAN_STATUSES.has(x) || x.includes("off plan") || x.includes("off-plan") || x.includes("under construction"));
}

export function isTier1Developer(p: MortgageEligibilityInput): boolean {
  const name = norm(p.developer_name || p.developer?.name);
  if (!name) return false;
  if (TIER_1_DEVELOPERS.has(name)) return true;
  // partial match — "Emaar Beachfront" etc.
  return Array.from(TIER_1_DEVELOPERS).some((d) => name.startsWith(d + " ") || name === d);
}

export function isMortgageEligible(p: MortgageEligibilityInput): boolean {
  if (!p) return false;
  if (isReady(p)) return true;
  if (isOffPlan(p)) {
    if (!isTier1Developer(p)) return false;
    const progress = Number(p.construction_progress ?? 0);
    return progress >= 50;
  }
  // Unknown status → hide by default (never falsely promise a mortgage).
  return false;
}

export function mortgageIneligibilityReason(p: MortgageEligibilityInput): string | null {
  if (isMortgageEligible(p)) return null;
  if (isOffPlan(p)) {
    if (!isTier1Developer(p)) {
      return "Mortgage financing is not available for off-plan projects from this developer. Banks typically finance only after handover.";
    }
    return "Mortgage financing becomes available once this off-plan project reaches 50% construction progress.";
  }
  return "Mortgage availability will be confirmed closer to handover.";
}
