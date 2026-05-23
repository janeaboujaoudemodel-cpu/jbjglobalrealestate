import { formatDisplayDate } from "@/utils/formatDate";

/**
 * Single source of truth for project status display.
 * `handover_date` drives everything:
 *   - past date  → "Ready"
 *   - future date → formatted date string (e.g. "Q4 2026" if exact day unknown, else "Dec 2026")
 *   - missing → falls back to status_label / availability_status when public-friendly
 */

const PUBLIC_STATUSES = new Set([
  "available","selling","limited","few left","sold out","launching",
  "coming soon","new","ready","under construction","off-plan","off plan",
  "handover soon","completed","delivered",
]);

export function isPublicStatus(s?: string | null): boolean {
  if (!s) return false;
  return PUBLIC_STATUSES.has(String(s).toLowerCase().trim());
}

export interface ProjectStatusResult {
  /** What to render in the card/pill (e.g. "Ready" or "Dec 2026"). */
  label: string;
  /** True when the project is delivered/ready (past handover). */
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
      if (d.getTime() <= Date.now()) {
        return { label: "Ready", isReady: true, date: null };
      }
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
        isReady: v.toLowerCase().includes("ready") || v.toLowerCase().includes("complet") || v.toLowerCase().includes("delivered"),
        date: null,
      };
    }
  }
  return { label: "TBA", isReady: false, date: null };
}
