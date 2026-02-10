/**
 * Shared date formatting utility
 * Converts ISO dates and quarter strings to human-readable DD Mon YYYY format
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a date string to "02 Jan 2026" format.
 * Handles:
 *  - ISO dates: "2026-01-02", "2026-01-02T00:00:00Z"
 *  - Quarter strings: "Q1 2026", "Q3 2025"
 *  - Already-formatted strings are returned as-is
 *  - null/undefined/invalid → empty string
 */
export function formatDisplayDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";

  const trimmed = dateStr.trim();

  // Quarter format: Q1 2026 → keep as-is (human-readable already)
  if (/^Q[1-4]\s+\d{4}$/i.test(trimmed)) {
    return trimmed;
  }

  // Try parsing as a date
  // For "YYYY-MM-DD" without time, parse manually to avoid timezone shifts
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]) - 1; // 0-indexed
    const day = parseInt(isoMatch[3]);

    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const dd = String(day).padStart(2, "0");
      return `${dd} ${MONTHS_SHORT[month]} ${year}`;
    }
  }

  // Fallback: try Date constructor for other formats
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      return `${dd} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch {
    // ignore
  }

  // Return original if unparseable
  return trimmed;
}
