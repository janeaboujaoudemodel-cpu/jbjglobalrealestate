# Backend Restoration, Contrast, Layout & Feature Fixes

Work is divided into 6 sequential batches. Each batch ends with a Playwright screenshot pass + manual DOM/computed-style audit before moving on. Nothing is claimed "done" without a screenshot proving it.

---

## Batch 1 — Restore the vertical sidebar

Revert the recent sidebar edits so it matches the previous locked state (the one the user approved).

- Restore `src/components/navigation/SidebarModePortalBlock.tsx`, `src/components/ModeSwitcher.tsx`, `src/contexts/UserModeContext.tsx`, `src/index.css` sidebar rules, and the `.lovable/memory/identity/unified-owner-role-standard.md` sidebar-related section to their prior versions (git log for each file → last commit before the sidebar refactor).
- Do **not** touch any other sidebar behavior.
- Verify: screenshot `/owner`, `/owner/crm`, `/owner/developers/projects` and diff against the user's uploaded sidebar screenshot (which shows the correct state).

## Batch 2 — Full backend contrast audit + fixes

Systematic, page-by-page. Not just pills.

Scope (every backend route under `/owner/**` and `/developer-hub/**`):
- Owner Panel, Overview, Document Studio, CRM, JBJ CRM, Developers Portal, Sales Reps, Briefings, Projects, Calendar, Access Requests, Developer Profiles, Listing Admin.

For each page:
1. Playwright script visits the page (authenticated via injected Supabase session).
2. Enumerate every element with `data-surface="emerald"` (or bg gradient containing `#064E3B`/`#042c1c`) and assert:
   - `color` is `rgb(255,255,255)` for text
   - all descendant `<svg>` have `color: white` and no `text-*` overrides
   - all badges/counters (e.g. "Investors 3", "Developers …") render numbers in white
3. Enumerate every element with the champagne/cream surface and assert dark `ink` text.
4. Enumerate all `hover:` states on dropdown menu items — replace any blue hover (`bg-accent` default, `bg-blue-*`, `text-blue-*`) with the emerald hover token.
5. Fix at the source (component or token), not per-instance.

Known offenders from the screenshots:
- Investors/Developers/Dev Sales Reps tab counters — number chip contrast.
- "All Emerald / All Languages" dropdown hover = blue → emerald.
- Various buttons still rendering ink-on-emerald or emerald-on-emerald.
- CRM stat cards (Calls Today / WhatsApp / Total Leads / Conversion) — icon tile contrast + card alignment.

Deliverable: one JSON report `/tmp/browser/contrast-report.json` listing every element checked, pass/fail, and the fix applied. Zero fails before moving on.

## Batch 3 — Backend layout fixes

- CRM entity tab row: the left/right scroll arrows currently overlay the "Investors / Developers / Developer Leads / Database" pills. Reserve horizontal space for the arrows (padding-inline on the scroll container, arrows positioned outside the scroll track) so no overlap at any viewport ≥ 375px.
- CRM stat cards: equalize card heights, icon-tile sizes, and grid gutter so all four cards align (`grid-cols-4` with `items-stretch`, consistent `min-h`).
- Any other misaligned cards found during Batch 2 screenshots.

Verify: screenshots at 1280, 1024, 768, 375 for `/owner/crm`.

## Batch 4 — Sales Reps: create + edit

`/owner/developers/reps` currently has no way to add a rep.

- Add "Add Sales Rep" button (emerald-ombre, white text/icon) in the page header, right side.
- Sheet/dialog with: name, email, phone, developer (select), emirates covered (multi), languages (multi), photo upload, notes.
- Wire to existing `developer_sales_reps` table (create migration if fields missing; include GRANTs + RLS scoped to owner role via `has_role`).
- Row actions: edit, deactivate.
- Verify: create a rep via Playwright, screenshot before/after, confirm row appears and filters work.

## Batch 5 — Briefings: developer + rep + star rating

`/owner/developers/briefings`:

- Briefing record fields: developer (FK), sales_rep (FK to `developer_sales_reps`), date, location, topics (text), rating (1–5 stars), notes, follow-up date.
- Add/edit sheet with those fields; star-rating control (emerald filled stars, white on emerald pill for the summary chip).
- List view: sortable by date, rating; filters by developer and rep.
- Migration for `developer_briefings` table if not present, with GRANTs + RLS.
- Verify: create a briefing with a 4-star rating, screenshot.

## Batch 6 — Projects: bulk publish, per-row publish, continuous enrichment

Two pages: `/owner/developers/projects` and `/owner/listing-admin` (or wherever the listing admin lives).

- Per-row: replace the always-"Unpublished" chip with a working Publish/Unpublish toggle that flips `projects.published` (or equivalent status column) and revalidates the query.
- Bulk toolbar (visible when ≥1 row selected):
  - Select all / Unselect all
  - Bulk Publish, Bulk Unpublish
  - Bulk Edit (opens sheet applying selected fields to all)
  - Bulk Enrich (queues `developer-auto-publish` edge function per selected project)
- Continuous enrichment: extend `developer-auto-publish` edge function so that for every published project it periodically re-scans approved sources (government portals + whitelisted developer sites already configured) and **merges** new fields into the project — never deletes existing owner-authored content. Merge policy: fill empty fields, append to arrays (dedup), skip fields locked by the owner.
- Verify: select 3 projects → Bulk Publish → screenshot showing all three as Published; run Bulk Enrich → confirm edge function invocation in logs and new fields appear.

---

## Cross-cutting rules (locked)

- No blue anywhere in backend UI. Hover states use emerald wash token.
- Emerald surfaces: text + icons + numeric badges are `#FFFFFF` — enforced by CSS contract on `[data-surface="emerald"] *`.
- Every batch ends with: `tsgo --noEmit` clean + Playwright screenshots at 1280×1800 stored under `/tmp/browser/batch-N/`, then user-visible summary listing what was verified with which screenshot.
- No claim of completion without a screenshot proving it.

## Technical notes

- Playwright: use `LOVABLE_BROWSER_SUPABASE_*` env for authenticated `/owner/**` routes; verify `LOVABLE_BROWSER_AUTH_STATUS=injected` first.
- CSS contract lives in `src/index.css` under a single `@layer components` block keyed on `[data-surface="emerald"]` — add `svg { color: #fff }` and `[data-count], .badge, .chip-count { color: #fff }` rules there so numeric counters inherit white.
- Sidebar restore: use `git log --oneline src/components/navigation/SidebarModePortalBlock.tsx` to find the commit prior to the recent refactor and restore that file's contents.
- Bulk actions on projects: use TanStack Table row selection state already present in the projects table; add a floating action bar bound to `table.getSelectedRowModel()`.
- Enrichment merge: implement `mergeProjectEnrichment(existing, incoming)` util with unit tests covering never-delete, array-dedup, and locked-field-skip cases.
