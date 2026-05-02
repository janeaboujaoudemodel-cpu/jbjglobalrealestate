## Goal

Remove every "fake" developer-logo placeholder from the site and show **only real developer logos** sourced from the `developers.logo_url` column. Where a developer has no real logo, show **nothing** (no Building2 icon tile, no monogram, no curated stand-in) — the slot disappears.

## What counts as a "fake" logo today

1. **Building2 icon fallback** rendered by `<DeveloperLogo renderFallback />` — currently shown on featured project cards, developer cards, area-developer bar, recommended developers, CRM relationships, etc. Looks like a generic building icon inside a champagne tile — visually a placeholder, not a brand.
2. **Initial-letter fallback** in `DeveloperPartnersMarquee.tsx` (lines 109–115) — shows a gold letter (e.g. "D") if the curated WebP fails to load.
3. **Curated `/developers/logos/*.webp` files** in `DeveloperPartnersMarquee` that are hand-picked for 11 developers and not driven by the database. These are not "fake" per se (they are real brand marks), but they are not the live market — the user said "add only the developer logos market", meaning the marquee should show real developers from the market (DB) that actually have a `logo_url`, not a hand-curated subset.

## Plan

### 1. Make `<DeveloperLogo>` never render a placeholder
- In `src/components/ui/DeveloperLogo.tsx`, deprecate the `renderFallback` prop: ignore it and always return `null` when the URL is invalid/missing.
- Remove the Building2 import and fallback markup.
- Keep the API signature so existing callers don't break — `renderFallback` becomes a no-op.

### 2. Clean up callers that relied on the slot existing
Audit these files and adjust layout where the absent logo would leave dead space:
- `src/components/home/FeaturedListings.tsx` (line 181) — overlay on cover image; absent is fine, image stays.
- `src/components/DeveloperCard.tsx` (3 spots) — wrap logo in a conditional so the surrounding tile doesn't show an empty box.
- `src/components/developer/RecommendedDevelopers.tsx`
- `src/components/area-detail/AreaDevelopersBar.tsx` — if no real logo, hide the developer chip entirely (don't list developers we can't visually represent).
- `src/components/crm/SentHistoryView.tsx`, `src/pages/CRMRelationships.tsx` — internal CRM, fall back to text-only name (no icon tile).

### 3. Rebuild `DeveloperPartnersMarquee` from the live market
Replace the hard-coded 11-developer array with a query:
```sql
SELECT name, slug, logo_url
FROM developers
WHERE logo_url IS NOT NULL
  AND logo_url <> ''
ORDER BY featured_rank NULLS LAST, name
LIMIT 40;
```
- Filter results client-side through `isValidDeveloperLogoUrl()` (already strips screenshots, WhatsApp images, etc.).
- Drop the initial-letter fallback span (lines 109–115); if an image errors, simply skip it.
- Keep the same champagne marquee styling, scroll animation, and Arabic/English heading.
- Remove the static `/developers/logos/*.webp` references from the component (the files on disk can stay; they're just no longer wired in).

### 4. Verification
- Visit `/` and confirm: the marquee shows real DB developer logos; featured project cards no longer show the Building2 icon when a developer has no logo (the corner is just empty over the cover image); developer cards/grids no longer show empty placeholder tiles.
- Run the existing contrast/lint guards (`scripts/contrast/*`) to make sure nothing regressed.
- Spot-check `/developers`, `/developer/:slug`, and the area-detail page.

## Technical notes

- Source of truth stays `developers.logo_url`, validated by `isAllowedLogoUrl` in `src/utils/developerLogo.ts` — no changes to the validator needed.
- The marquee will need a small `useEffect` + `supabase.from('developers').select(...)` fetch with a loading state (just don't render the section until at least ~6 valid logos resolve, to avoid a flash of empty marquee).
- No DB migration required.
- `renderFallback` is left in the prop type as deprecated to avoid touching ~10 call sites; a follow-up PR can remove it entirely.

## Out of scope

- Backfilling missing `logo_url` values in the `developers` table (that's a data task, not a code change).
- Changing the Building2 icon used elsewhere (e.g. as a generic building indicator in property cards) — only the developer-logo fallback is removed.