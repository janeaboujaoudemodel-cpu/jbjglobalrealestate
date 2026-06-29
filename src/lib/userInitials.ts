/**
 * Unique user initials policy (GLOBAL).
 * - Owner exception: always returns "JB".
 * - Everyone else: first letter of first name + first letter of last name.
 *   Falls back to the first two letters of the local-part of the email
 *   when only a single token is available, and "U" as last resort.
 */
export function getUserInitials(opts: {
  displayName?: string | null;
  email?: string | null;
  isOwner?: boolean;
}): string {
  if (opts.isOwner) return "JB";

  const name = (opts.displayName || "").trim();
  if (name) {
    const tokens = name.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
    }
    const single = tokens[0];
    if (single.length >= 2) return (single[0] + single[1]).toUpperCase();
    if (single.length === 1) return single[0].toUpperCase();
  }

  const local = (opts.email || "").split("@")[0];
  if (local.length >= 2) return (local[0] + local[1]).toUpperCase();
  if (local.length === 1) return local[0].toUpperCase();
  return "U";
}
