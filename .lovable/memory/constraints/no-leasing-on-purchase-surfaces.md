---
name: No Leasing on Purchase Surfaces
description: projects.listing_kind='leasing' rows are banned from every buy/quiz/recommendation/compare/area/featured/search/mortgage/brochure surface. Public project queries must wrap with applyPurchaseOnly(). PricePill renders /yr when listingKind=leasing.
type: constraint
---

# No Leasing on Purchase Surfaces

`projects.listing_kind = 'leasing'` rows are RENTAL listings whose `price_from`
is an **annual rent** value in AED. Rendering them inside a buy-flow card is a
real money bug — an investor sees "From AED 190K" and thinks they can purchase
Al Tajer 2 for AED 190K when the unit is actually a rental at AED 190K/yr.

## The rule

1. **Every public/buyer-flow query against `projects`** must exclude leasing.
   Use the helper:

   ```ts
   import { applyPurchaseOnly } from "@/lib/projects/excludeLeasing";

   const baseQuery = supabase
     .from("projects")
     .select("...")
     .eq("is_published", true);
   const { data, error } = await applyPurchaseOnly(baseQuery);
   ```

   Or chain inline:

   ```ts
   .or("listing_kind.is.null,listing_kind.neq.leasing")
   ```

2. **PricePill** (`src/components/ui/price-pill.tsx`) renders `/yr` when
   `listingKind === 'leasing'`. Pass `listingKind` from any rental-permitted
   surface so a leak still reads as rental.

3. **Owner / admin / listing-admin / developer & broker portals / rentals hubs
   / secondary market / scrapers** MUST keep showing leasing rows — never apply
   this filter there.

## Why

DB confirmed: `Al Tajer 2 (slug al-tajer-2-810df24a)` → `listing_kind=leasing`,
`price_from=190000`. It was reaching `/quiz-results` because the slug-hydration
query did not filter `listing_kind` (or `is_published`). Both filters are now
mandatory on purchase surfaces.

## Out of scope

- DB schema changes (none needed).
- Renaming `listing_kind` values.
- Removing the `Rentals` / `Secondary Market` hubs.
