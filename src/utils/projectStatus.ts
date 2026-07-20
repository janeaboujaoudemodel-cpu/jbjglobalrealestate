import { formatDisplayDate } from "@/utils/formatDate";

/**
 * Single source of truth for project status display.
 * Public-safe project status display. Never infer "Ready" from a past date;
 * that is a legal completion claim and must be explicit in verified source data.
 */

const PUBLIC_STATUSES = new Set([
  "available","selling","limited","few left","sold out","launching",
  "coming soon","new","under construction","off-plan","off plan",
  "handover soon",
]);

export function isPublicStatus(s?: string | null): boolean {
  if (!s) return false;
  return PUBLIC_STATUSES.has(String(s).toLowerCase().trim());
}

export interface ProjectStatusResult {
  /** What to render in the card/pill (e.g. "Dec 2026"). */
  label: string;
  /** True only when explicit source data says delivered/ready. */
  isReady: boolean;
  /** Raw date when in the future, else null. */
  date: string | null;
}

export function getProjectStatus(p: {
  handover_date?: string | null;
  status_label?: string | null;
  availability_status?: string | null;
  completion_status?: string | null;
}): ProjectStatusResult {
  const raw = p.handover_date;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return { label: formatDisplayDate(raw) || raw, isReady: false, date: raw };
    }
  }
  // Fallback to explicit status labels only when they're public-friendly
  const candidates = [p.status_label, p.completion_status, p.availability_status];
  for (const c of candidates) {
    if (isPublicStatus(c)) {
      const v = String(c).trim();
      return {
        label: v.charAt(0).toUpperCase() + v.slice(1),
        isReady: false,
        date: null,
      };
    }
  }
  return { label: "Coming soon", isReady: false, date: null };
}
