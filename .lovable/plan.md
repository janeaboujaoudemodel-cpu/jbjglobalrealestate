## What's broken on /properties

After auditing `src/pages/Properties.tsx`, `src/components/ProjectCard.tsx`, `src/components/ReellyProjectCard.tsx` and `src/hooks/useProjects.ts`, three real issues stack up into the blank/laggy page you're seeing:

1. **Cards silently disappear** — `ProjectCard` and `ReellyProjectCard` return `null` whenever the `<img>` `onError` fires or the cover URL is briefly empty. Many DB cover URLs are slow CDN images; the first failed load wipes the card from the DOM, so the grid renders empty even though 1,373 published projects exist with covers.
2. **Fragment + key bug in the grid loop** — `Properties.tsx` lines ~1318–1338 wrap each card in a `<>` fragment but put `key` on `<ProjectCard>` (and on the inline ad). React can't reconcile a keyless fragment list cleanly, which causes flicker and occasional blank renders on filter changes.
3. **Listing query is heavy and double-paginated** — `useProjectsListing` requests 200 rows, then opens a count query and N×1,000-row backfills via `Promise.all`. Combined with the artificial 250 ms `isFiltering` skeleton on every filter/sort change, the page feels frozen.

## Fix plan (frontend only — no schema/data changes)

### A. Stop hiding cards on image errors
- `src/components/ProjectCard.tsx`
  - Remove `brokenImage` state + `return null` guard (line 85, 88, 224).
  - Replace the `<img>` `onError` with a graceful fallback: swap `src` to the next available `images[]` URL, then to `project.cover_image_url`, then to a champagne placeholder div (no image element). Card always renders.
- `src/components/ReellyProjectCard.tsx` — same change (lines 78, 81, 183).

### B. Fix the grid loop
- `src/pages/Properties.tsx` (~1313–1339): replace the `return (<>…</>)` pattern with a flat array — push `<ProjectCard key={project.id} … />` and conditionally push `<FeaturedProjectAd key={…} />` into the same `.map`/`.flatMap`. Removes the keyless-fragment warning and the resulting reconciliation flicker.

### C. Make the listing query lighter and snappier
- `src/hooks/useProjects.ts` `useProjectsListing`:
  - Drop the background backfill loop. Return the first 500 published+covered rows in one query (still ordered by `created_at desc`).
  - If we later need "load more", add an explicit paginated hook — not a silent background flood.
- `src/pages/Properties.tsx` line 408: shorten the artificial filtering skeleton from 250 ms to 0 (let React render synchronously). Keep `isLoading` for the initial fetch only.

### D. Sanity verification after the edits
- Reload `/properties`, confirm cards render immediately and the count matches the DB (1,373 published with covers).
- Toggle a filter (e.g. Off-Plan, Emirate=Dubai) — grid should refresh without the blank flash.
- Check console: the `validateDOMNesting <a> inside <a>` warning from `FeaturedListings` is a separate cosmetic issue and is **not** in scope for this fix.

### Out of scope (call out, don't touch this turn)
- Vertical-nav auto-collapse, developer logo wiring, sq ft toggle styling, and the Speak-to-Concierge widget — all unchanged.
- No DB migrations, no RLS changes, no edge functions.
