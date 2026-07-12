
## Scope

Upgrade the `/compare` (Projects) experience so a JBJ user can:

1. Search & pick properties from the existing database picker.
2. If the property doesn't exist:
   - **Owner** sees an inline "Add this project" CTA (wired to the existing `AddProjectDialog` / `compare-extract` flow) that writes into the backend `projects` table.
   - **Non-owner** sees only a neutral empty-state ("No results") — no add prompt, no message, nothing hinting the ability exists.
3. Export the comparison in every requested format, in two color themes.
4. Send a branded report to a client with a live listing link auto-attached.

## New export suite

A single `ComparisonExportBar` component replaces the current scattered Download/Excel/WhatsApp/Email buttons and adds:

- **PDF** (rasterised, hi-DPI via `html2canvas` + `jspdf`, existing pattern in codebase)
- **PNG** (single-image capture of the report frame)
- **JPG** (same, JPEG encoder, quality 0.95)
- **PowerPoint (.pptx)** — via `pptxgenjs` (already available per skills)
- **Slides link** — Google Slides deep-link seeded from the same pptx (fallback: uploads pptx and opens `slides.new`)
- **Excel** (keep existing `exportPremiumXlsx`)
- **WhatsApp / Email share** (keep, but auto-append the auto-generated public comparison URL + per-project listing URLs)

Each export offers a theme toggle:

- **Emerald** (`#064E3B → #042c1c → #000` — same tokens as AI tools, `REPORT_TOKENS.emeraldGradient`)
- **White** (page `#FDFBF7`, ink `#1A1A1A`, emerald accents only on headers/rules)

Theme is picked once in a small popover before export; the export renders an offscreen "print frame" (`ComparisonReportFrame`) styled with the chosen theme so the on-screen UI is unaffected.

### Auto-generated listing links

For every project in the comparison, `getListingUrl(project)` resolves to:

```
${window.location.origin}/projects/${project.slug || project.id}
```

Both the PDF/PPTX report and the WhatsApp/Email body list each project with its clickable listing URL, plus a top-level `share url` that links back to the current `/compare?ids=…` state (already encoded in query params).

## Owner-only "add project" from search

Update `CompareProjectPicker`:

- Read `useIsAppOwner()` (already imported).
- When search yields 0 results:
  - Owner → render an emerald "Add \"{query}\" to the database" card that opens `AddProjectDialog` prefilled with the query. On success it re-queries and auto-selects the new project.
  - Non-owner → render only the plain "No projects match your search" line. No CTA, no hint.

No RLS changes — insert already goes through the existing `compare-extract` / owner-only paths.

## Files

New:
- `src/components/compare/ComparisonExportBar.tsx` — export button group + theme popover.
- `src/components/compare/ComparisonReportFrame.tsx` — offscreen printable frame (emerald + white variants) using `REPORT_TOKENS`.
- `src/utils/exportComparison.ts` — `exportPdf`, `exportImage('png'|'jpg')`, `exportPptx`, `buildShareText`.

Edited:
- `src/pages/Compare.tsx` — replace inline CTA export buttons (lines ~963–1024) with `<ComparisonExportBar analysis={aiAnalysis} projects={projects} />`.
- `src/components/compare/CompareProjectPicker.tsx` — owner-gated empty-state add card.

Deps: `pptxgenjs`, `html2canvas`, `jspdf` (add only if missing).

## E2E validation (mandatory)

Playwright script at `/tmp/browser/compare-e2e/run.py`:

1. Restore Supabase session (owner) → visit `/compare`.
2. Open picker, select 2 projects → screenshot `1_selected.png`.
3. Trigger AI analysis (or use fixture) → screenshot `2_analysis.png`.
4. Click export bar → screenshot `3_export_menu.png`.
5. Export each format (PDF, PNG, JPG, PPTX) in emerald theme, then white theme; save files to `/tmp/browser/compare-e2e/out/` and screenshot the offscreen frame in both themes → `4_emerald.png`, `5_white.png`.
6. Second run in a fresh context with **no session** (visitor): search for a non-existent project → screenshot `6_visitor_empty.png` proving no add CTA.
7. Third run authed as owner: same empty search → screenshot `7_owner_empty.png` showing the add CTA.
8. `code--view` every screenshot to confirm; only then report success.

## Non-goals

- No changes to `/compare-manual`.
- No new RLS / migration.
- No changes to unit-compare mode.
