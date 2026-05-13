/**
 * Shared date formatting utility
 * Converts ISO dates and quarter strings to human-readable DD Mon YYYY HH:mm format
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format a Date as "h:mm AM/PM" (e.g. "6:28 PM") in local time. */
function formatTime12(d: Date): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Format a date string to "02 Jan 2026 14:30" format.
 * Handles:
 *  - ISO dates: "2026-01-02", "2026-01-02T14:30:00Z"
 *  - Quarter strings: "Q1 2026", "Q3 2025"
 *  - Already-formatted strings are returned as-is
 *  - null/undefined/invalid → empty string
 *
 * When the input includes time information (T separator), the time is included.
 * Date-only inputs (YYYY-MM-DD) omit the time.
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
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]) - 1; // 0-indexed
    const day = parseInt(isoMatch[3]);

    if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
      const dd = String(day).padStart(2, "0");
      const datePart = `${dd} ${MONTHS_SHORT[month]} ${year}`;

      // If time components exist in the original string, append 12-hour time with AM/PM
      if (isoMatch[4] !== undefined && isoMatch[5] !== undefined) {
        // Re-parse via Date so we get local-time hours/AM-PM correctly.
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          return `${datePart} ${formatTime12(d)}`;
        }
        // Fallback to raw HH:mm if parsing fails.
        return `${datePart} ${isoMatch[4]}:${isoMatch[5]}`;
      }

      return datePart;
    }
  }

  // Fallback: try Date constructor for other formats
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const datePart = `${dd} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
      // Include time (with AM/PM) if the original string had a T separator
      if (trimmed.includes("T")) {
        return `${datePart} ${formatTime12(d)}`;
      }
      return datePart;
    }
  } catch {
    // ignore
  }

  // Return original if unparseable
  return trimmed;
}
