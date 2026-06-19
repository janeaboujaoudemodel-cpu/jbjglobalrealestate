/**
 * applyPurchaseOnly — single source of truth for excluding rental/leasing
 * listings from every PURCHASE-flow query (quiz, recommendations, featured
 * listings, area grids, global search, compare, brochure generator, etc.).
 *
 * `projects.listing_kind` is nullable; legacy/sale rows are NULL, rental
 * rows are 'leasing'. Use `.or(...)` so NULL rows pass.
 *
 * Owner / admin / listing-admin / rentals hubs MUST NOT use this helper —
 * they need full visibility.
 *
 * Usage:
 *   const q = supabase.from('projects').select(...).eq('is_published', true);
 *   const { data } = await applyPurchaseOnly(q);
 */

export function applyPurchaseOnly<T extends { or: (filter: string) => T }>(query: T): T {
  return query.or('listing_kind.is.null,listing_kind.neq.leasing');
}

/** Client-side guard for already-fetched rows. */
export function isPurchaseListing(row: { listing_kind?: string | null } | null | undefined): boolean {
  if (!row) return false;
  const k = (row.listing_kind || '').toLowerCase();
  return k !== 'leasing' && k !== 'rent' && k !== 'rental';
}
