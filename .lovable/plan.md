## Goal

Make the hero search bar (`HomeHeroSearch`) a real, functioning search that **redirects** the user to a results page — not a UI that re-opens the same `GlobalSearchModal` dropdown the header icon uses.

The header search icon stays unchanged: it still opens `GlobalSearchModal` exactly as today.

## Current behavior

`src/components/home/HomeHeroSearch.tsx` lazy-imports `GlobalSearchModal` and, on submit, just sets `searchOpen = true` and renders the modal — so the hero bar is effectively a duplicate trigger for the header dropdown, with no real redirect.

## New behavior for the hero bar

On submit (Enter key or the obsidian "Search" button click):

1. Trim the query.
2. If the query is empty → navigate to `/properties` (browse all).
3. Otherwise, do a fast top-match lookup against the same three Supabase tables `GlobalSearchModal` already queries (`projects`, `developers`, `areas`):
   - First exact (case-insensitive) match on a project name → `/project/:slug`
   - Else exact match on a developer name → `/developer/:slug`
   - Else exact match on an area name → `/area/:slug`
   - Else fall back to results: `/properties?q=<encoded query>` (the `Properties` page already reads `?q=` / `?keyword=` / `?search=`).
4. Save the query into the existing recent-searches store (`saveRecentSearch`) so it shows up in the header modal next time.
5. Show a brief inline "Searching…" state on the button while the lookup runs (≈200–400 ms) and disable double submits.

Remove the lazy `GlobalSearchModal` import and the `<GlobalSearchModal …>` render from `HomeHeroSearch` entirely — the hero bar will no longer open any dropdown.

The two inline CTAs already in the bar are untouched:
- "Book a Free Consultation" → still calls `onBookConsultation` (Index opens the inquiry modal).
- "Ask Concierge" → still dispatches `jbj:open-concierge`.

The mobile stacked fallback row keeps the same behaviors.

## Header search icon

No change. The header icon continues to open `GlobalSearchModal` as today. Only the hero bar is rewired to redirect.

## Files to change

- `src/components/home/HomeHeroSearch.tsx` — rewire submit to perform the top-match lookup + `useNavigate` redirect, drop the `GlobalSearchModal` mount, add a transient loading state on the Search button.

No other files need edits. No schema changes. No new routes.

## Verification

- Type "Emaar" in the hero bar → press Enter → lands on `/developer/emaar` (or whatever slug matches), without any modal opening.
- Type a project name → lands on `/project/:slug`.
- Type a generic term like "marina 2br" → lands on `/properties?q=marina%202br` and the Properties page filters by that keyword.
- Empty submit → lands on `/properties`.
- Clicking the header search icon still opens the dropdown modal exactly as before.
