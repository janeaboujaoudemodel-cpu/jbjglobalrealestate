// Merge policy for continuous project enrichment.
// Rules:
//   1. NEVER delete or overwrite an existing non-empty field.
//   2. Fill fields that are null / undefined / "" on the existing project.
//   3. For array fields, append + dedupe (case-insensitive for strings).
//   4. For object fields, shallow-merge with the same fill-empty rule.
//   5. Skip any field name listed in `locked` (owner-authored fields).
//   6. Return { merged, changedKeys } — no side effects.

export type Row = Record<string, unknown>;

const isEmpty = (v: unknown): boolean =>
  v === null ||
  v === undefined ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && v !== null && Object.keys(v as object).length === 0);

const dedupeArray = (arr: unknown[]): unknown[] => {
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const item of arr) {
    const key =
      typeof item === "string"
        ? item.trim().toLowerCase()
        : JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
};

export function mergeProjectEnrichment(
  existing: Row,
  incoming: Row,
  locked: string[] = [],
): { merged: Row; changedKeys: string[] } {
  const lockedSet = new Set(locked);
  const merged: Row = { ...existing };
  const changedKeys: string[] = [];

  for (const [key, incomingVal] of Object.entries(incoming)) {
    if (lockedSet.has(key)) continue;
    if (isEmpty(incomingVal)) continue;

    const existingVal = existing[key];

    // Case A: existing empty → fill with incoming.
    if (isEmpty(existingVal)) {
      merged[key] = incomingVal;
      changedKeys.push(key);
      continue;
    }

    // Case B: both arrays → append + dedupe.
    if (Array.isArray(existingVal) && Array.isArray(incomingVal)) {
      const combined = dedupeArray([...existingVal, ...incomingVal]);
      if (combined.length !== existingVal.length) {
        merged[key] = combined;
        changedKeys.push(key);
      }
      continue;
    }

    // Case C: both plain objects → shallow merge (fill-empty on nested keys).
    if (
      typeof existingVal === "object" &&
      typeof incomingVal === "object" &&
      existingVal !== null &&
      incomingVal !== null &&
      !Array.isArray(existingVal) &&
      !Array.isArray(incomingVal)
    ) {
      const nested = { ...(existingVal as Row) };
      let nestedChanged = false;
      for (const [k, v] of Object.entries(incomingVal as Row)) {
        if (isEmpty(nested[k]) && !isEmpty(v)) {
          nested[k] = v;
          nestedChanged = true;
        }
      }
      if (nestedChanged) {
        merged[key] = nested;
        changedKeys.push(key);
      }
      continue;
    }

    // Case D: scalar with an existing value → keep existing (never overwrite).
  }

  return { merged, changedKeys };
}
