/**
 * Area name matching that tolerates real-world spelling drift.
 *
 * The canonical `areas` table says "Siniya Island" / "Al Rawdah" while imported
 * project rows carry "Siniyah Island" / "Al Raudah". A strict substring compare
 * returned zero results for those filters even though projects exist, so the
 * filter looked broken. Matching is therefore: normalise → substring → bounded
 * edit distance on the normalised form.
 */

export const normalizeAreaName = (value: string | null | undefined) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(al|el|the|district|community|area)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Damerau-lite Levenshtein distance, early-exit above `max`. */
function withinDistance(a: string, b: string, max: number): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    let best = curr[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < best) best = curr[j];
    }
    if (best > max) return false;
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length] <= max;
}

/** True when `haystack` (a project's location text) refers to `needle` (an area). */
export function areaMatches(haystack: string | null | undefined, needle: string): boolean {
  const h = normalizeAreaName(haystack);
  const n = normalizeAreaName(needle);
  if (!h || !n) return false;
  if (h.includes(n) || n.includes(h)) return true;
  const tolerance = n.length >= 10 ? 2 : n.length >= 6 ? 1 : 0;
  if (!tolerance) return false;
  if (withinDistance(h, n, tolerance)) return true;
  // Compare the needle against each comma/word segment of the haystack.
  return h
    .split(" ")
    .reduce<string[]>((acc, word, idx, arr) => {
      acc.push(word);
      if (idx + 1 < arr.length) acc.push(`${word} ${arr[idx + 1]}`);
      return acc;
    }, [])
    .some((chunk) => withinDistance(chunk, n, tolerance));
}
