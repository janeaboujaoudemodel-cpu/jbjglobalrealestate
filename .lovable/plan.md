

## Goal

Persistently detect and log any `@media print` rules that hide content (display:none, visibility:hidden, opacity:0, etc.), store them, and automatically re-apply counter-overrides on future runs so the baseline stays clean.

## Approach

A small runtime engine that:
1. **Scans** all stylesheets for `@media print` blocks containing content-suppressing rules (`display:none`, `visibility:hidden`, `opacity:0`, `height:0`, `width:0`).
2. **Logs** discovered selectors to a Supabase table (`print_blocker_log`) once per session per selector hash.
3. **Persists** the latest known blocker list to localStorage as a fast cache.
4. **Reapplies** counter-overrides at boot (`@media print { selector { display: revert !important; visibility: visible !important; opacity: 1 !important; } }`) so the next baseline render is clean even if a regression reintroduces a blocker.

## Changes

### 1. New: `src/lib/printBlockerEngine.ts`
- `scanPrintBlockers()` — walks `document.styleSheets`, parses `CSSMediaRule` whose media text contains `print`, collects rules whose style sets the suppressing properties. Returns `{ selector, properties, source }[]`.
- `applyPrintOverrides(blockers)` — injects a single `<style id="print-blocker-overrides">` element with `@media print` overrides forcing visibility for each selector.
- `loadCachedBlockers()` / `saveCachedBlockers()` — localStorage cache (`jbj_print_blockers_v1`).
- `logBlockersToServer(blockers)` — best-effort insert into `print_blocker_log`, deduped by `selector_hash` per session via sessionStorage.

### 2. New: `src/components/PrintBlockerGuard.tsx`
- 1-component mount inside `App.tsx` (next to `PrintModeBoundary`).
- On mount: load cached blockers → apply overrides immediately → idle-callback scan → merge new blockers → re-apply → log new ones to server.
- Re-runs on route change so SPA-injected stylesheets (lazy-loaded chunks) are caught.

### 3. New migration: `print_blocker_log` table
Columns: `id uuid pk`, `selector text`, `selector_hash text`, `properties jsonb`, `source text` (stylesheet href or `inline`), `route text`, `user_agent text`, `created_at timestamptz`.
RLS: insert allowed for anyone (anon + authenticated); select restricted to owner (`has_role(auth.uid(), 'admin')` or owner email check via existing `is_owner()` function).
Unique index on `(selector_hash, route)` to keep table small (use `ON CONFLICT DO NOTHING` from client).

### 4. Mount in `src/App.tsx`
Add `<PrintBlockerGuard />` next to `<PrintModeBoundary />` inside `BrowserRouter`.

### 5. Owner panel link (read-only viewer) — **deferred / out of scope**
Not building a UI now. Owner can query `print_blocker_log` via existing data tools. (Mentioning so it's clear this is intentional.)

## Files touched

- `src/lib/printBlockerEngine.ts` (new)
- `src/components/PrintBlockerGuard.tsx` (new)
- `src/App.tsx` — mount guard
- `supabase/migrations/<timestamp>_print_blocker_log.sql` (new) — table + RLS

## Out of scope

- No UI page for browsing the log (owner uses existing tools).
- No changes to `usePrintMode`, `MainLayoutWrapper`, `PopupLayer`, or `CompanyProfileDownload` — print mode behavior is unchanged.
- No removal of any existing CSS — only additive `@media print` overrides.
- No changes to the static Company Profile PDF.

