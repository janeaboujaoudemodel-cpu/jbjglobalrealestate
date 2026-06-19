# Fix: Rental price shown on purchase surfaces

## Root cause

`projects.listing_kind = 'leasing'` rows (e.g. Al Tajer 2 @ AED 190K = annual rent) are leaking into purchase surfaces. Two specific holes:

1. `src/pages/QuizResults.tsx` hydrates by `slug` only — no `is_published` and no `listing_kind` filter, so a stale matchmaker session can rehydrate a leasing row.
2. Public project queries (Quiz, Featured, Continue Searching, Recommendations, Area grids, Global Search, Compare, Properties grid, Mortgage Calculator, Brochure Generator, etc.) never exclude `listing_kind = 'leasing'`, so any leasing row that is `is_published = true` flows into "buy" UIs.

Confirmed in DB: `Al Tajer 2` → `listing_kind = leasing`, `price_from = 190000` AED (annual).

## Changes

### 1. Centralize the rule
- New helper `src/lib/projects/excludeLeasing.ts`: `applyPurchaseOnly(query)` that appends `.or('listing_kind.is.null,listing_kind.neq.leasing')`. Single source of truth.

### 2. Apply on every purchase-flow query
Add `applyPurchaseOnly(...)` to these queries (do NOT touch owner/admin/CRM/editor or rental-dedicated screens):
- `src/pages/Quiz.tsx` (`all-projects-quiz`)
- `src/pages/QuizResults.tsx` (slug-hydration) + also enforce `.eq('is_published', true)`
- `src/components/ContinueSearching.tsx` (both queries)
- `src/components/PropertyRecommendationPopup.tsx` (both queries)
- `src/components/home/FeaturedListings.tsx` and `ResalePropertiesSection.tsx` (purchase grid only)
- `src/components/GlobalSearchModal.tsx`
- `src/components/ComparisonBar.tsx`
- `src/components/MortgageCalculator.tsx`
- `src/components/area-detail/AreaProjectsGrid.tsx`, `AreaMapSection.tsx`, `AreaAIAnalyzer.tsx`
- `src/components/broker/BrokerPDFGenerator.tsx`, `BrokerAITools.tsx`
- `src/components/filters/AdvancedFilterPanel.tsx`
- `src/hooks/useLocalProjectSearch.ts`
- `src/hooks/useProjects.ts` (public-read paths only)
- `src/components/toolkit/BrochureGeneratorPage.tsx`
- `src/components/video-meet/MeetingAIAssistant.tsx`

Out of scope (must keep showing leasing): owner dashboard, listing admin, developer/broker portals, e-signature, secondary-market/rentals hubs, market intelligence backend, scrapers.

### 3. Rental-aware PricePill
- `src/components/ui/price-pill.tsx`: accept optional `listingKind?: string | null`. When `listingKind === 'leasing'`, render `From AED 190K /yr` (orange value + "/yr" suffix in ink). Prevents any surviving leasing row from being mistaken for a sale price.
- No callsite migration required (prop is optional); selectively pass it from rental hubs that legitimately render leasing.

### 4. Self-heal stale matchmaker session
In `QuizResults.tsx`, after the filtered fetch, if any requested slug is missing from the result (filtered out as leasing/unpublished/sold), call `clearMatchmakerSession()` for that slug list and show the existing "Saved selection isn't available — start a new match" empty state instead of partial cards.

### 5. CI guard
- Extend `scripts/lint/check-brand-hex.mjs` neighbours OR add `scripts/contrast/check-leasing-leak.mjs`: fail if any file under `src/pages` / `src/components` (excluding allowlist of owner/admin/rentals paths) calls `.from('projects')` without `applyPurchaseOnly` or an explicit `// leasing-ok` comment. Wired into pre-commit.

### 6. Memory
Add `mem://constraints/no-leasing-on-purchase-surfaces.md` and one Core line in `mem://index.md`:
> Purchase Surfaces: `listing_kind='leasing'` rows are BANNED from every buy/quiz/recommendation/compare/area/featured/search grid. Always wrap public project queries with `applyPurchaseOnly()`. PricePill must render `/yr` when listingKind=leasing.

## Out of scope
No schema/DB changes. No styling changes. No copy changes beyond the `/yr` suffix on leasing PricePill.

## Verification
1. Reload `/quiz-results?projects=al-tajer-2-...` → empty-state "Start a new match" (Al Tajer 2 filtered as leasing).
2. Quiz run → Al Tajer 2 never returned.
3. Global Search "Al Tajer" → 0 results on public; still visible inside owner/admin.
4. Any leasing row passed to `<PricePill listingKind="leasing" price={190000} />` renders `From AED 190K /yr`.
