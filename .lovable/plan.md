# Developer Excel Import — Rebuild + Drive AI Enrichment

## What's broken today (verified in `DeveloperExcelImportDialog.tsx`)

- Your file's first row is a title ("DEVELOPER'S REGISTRATION MONITORING"), so the parser treats it as the header → every column becomes `__EMPTY`, `__EMPTY_1` … which is why every dropdown is "ignore".
- Preview is hardcoded to 5 rows.
- Mapping selects are native `<select>` → get the browser's blue focus/hover ring (violates the no-blue rule) and look broken vertically at your zoom.
- 1650 rows are processed one-by-one with a per-row `SELECT` → very slow, blocks the UI, and can time out.
- No drag-and-drop — only a click-to-pick input.
- Footer shows row count (`Import 1650 rows`) instead of the deduped developer count.
- No `google_drive_url` field, no Drive AI pipeline.
- Merge rule is inverted from what you want (current code fills blanks only for everyone).

## The rules I will implement (Excel-wins with two exceptions)

Per row, keyed on developer name (normalized/slug):

| Developer | Rule |
| --- | --- |
| **Amra** | **Never touched.** Row skipped entirely. |
| **Citi Developers** | **Fill-blanks-only.** Existing non-empty fields kept. |
| Everyone else — already in DB | **Excel wins.** Non-empty Excel cells overwrite existing fields. Empty Excel cells never wipe existing data. |
| Everyone else — new | Insert as `is_hidden = true` for owner review, then can be published. |

No duplicates: dedupe by normalized slug (fallback: case-insensitive name).

## Rebuilt import dialog

- **Drag-and-drop zone** (drop file anywhere on the dropzone) + click-to-pick. Accepts `.xlsx / .xls / .csv`.
- **Smart header detection**: scan first ~10 rows; pick the row where the most cells match known aliases (Name, Developer, Website, CEO, Founder, Founded, Description, Phone, Email, LinkedIn, Instagram, Projects, Specialization, Parent, Logo, **Google Drive**). Rows above it are dropped. This is what fixes the "empty empty ignore ignore" screen.
- **Column mapping** using the shadcn `Select` (champagne + emerald accent, no blue). Two-column responsive grid, larger tap targets.
- **Preview shows ALL rows**, virtualised (`@tanstack/react-virtual`) so 1650 rows scroll smoothly. Sticky header, monospaced cells, no vertical overflow.
- **Footer summary** shows the counts you asked for:
  - `1650 rows in file · 612 unique developers · 48 new · 561 will be enriched · 3 protected (Amra / Citi rules)`
  - Primary button reads `Import 612 developers` (deduped count, never row count).
- **Progress bar** during import (batched updates every 25 rows) — no more frozen UI.
- **Buttons re-laid** on their own row on narrow widths so "Choose another file" / "Import …" never clip.

## Import engine (client → edge function)

Move the heavy work off the browser:

- New Supabase edge function `bulk-import-developers` (owner-only, service role).
- Client uploads the parsed JSON payload once; function processes in batches of 50 with a single `SELECT id, slug, name, <fields>` per batch (not per row), applies the rule table above, and returns `{ created, updated_excel_wins, filled_only_citi, protected_amra, skipped, total_unique }`.
- Idempotent: re-uploading the same file produces zero writes when nothing changed.

## New field: `google_drive_url` + AI pipeline

Migration:

```text
developers.google_drive_url text        -- from Excel column "Google Drive"
developers.drive_enrichment_status text  -- queued | running | done | failed
developers.drive_last_synced_at timestamptz
```

New table `developer_drive_jobs` (owner + service-role RLS, GRANTs included) tracks each Drive scan: `developer_id`, `folder_url`, `status`, `discovered_projects`, `discovered_documents`, `error`, timestamps.

Edge function `enrich-developer-from-drive`:

1. Lists files in the shared Drive folder (Google Drive API — needs a `GOOGLE_DRIVE_API_KEY` or service-account JSON secret; I'll request it via `add_secret` before this step runs).
2. For every PDF / DOCX / image: parse with existing `document--parse` style helpers → feed text to Lovable AI Gateway (`google/gemini-2.5-flash`) with a strict JSON schema to extract:
   - Company profile → enriches developer bio, CEO, founding year, HQ, specialization if still blank (respects Amra/Citi rules).
   - Project brochures → creates `projects` rows (dedupe by name+developer), attaches area/community, uploads brochure to `project-documents` bucket, links via `project_documents`.
   - Area / community fact sheets → creates/enriches `areas` and `communities`.
   - All source files also stored under `developer_documents` so end-users can download them from the developer page (books/brochures section).
3. Uses the existing project extraction AI (same one that powers "Rebuild from site") — I just point it at Drive-sourced text instead of scraped HTML. Nothing new to build model-side.
4. Auto-runs on Excel import for every row that has a Drive link; also re-runs on demand from the developer profile ("Sync Google Drive" button).

## Files I will touch

- `src/components/owner/DeveloperExcelImportDialog.tsx` — full rewrite (drag-drop, smart headers, virtualised preview, shadcn Select, deduped counts, progress).
- `supabase/functions/bulk-import-developers/index.ts` — new.
- `supabase/functions/enrich-developer-from-drive/index.ts` — new.
- Migration: add `google_drive_url`, `drive_enrichment_status`, `drive_last_synced_at` to `developers`; create `developer_drive_jobs` with GRANTs + RLS.
- `src/pages/admin/DeveloperProfilePage.tsx` — add "Sync Google Drive" button + status pill (small addition, no other behaviour changed).
- `src/pages/developer-hub-admin/DeveloperDirectory.tsx` — wire the new dialog result toast to show deduped counts.

## Locked constraints (I will not deviate)

- Amra: never touched.
- Citi Developers: fill blanks only.
- All other existing developers: Excel-wins, non-empty cells overwrite; empty cells never wipe.
- Zero duplication (dedupe by slug, fallback name case-insensitive).
- No blue anywhere in the dialog (shadcn Select on emerald/champagne).
- Nothing outside the files listed above is modified.

## End-to-end test I will run before saying it's done

1. Playwright: open `/owner/developers`, drag your uploaded Excel into the drop zone, screenshot header detection working (no more `__EMPTY`).
2. Screenshot the mapping grid — no blue, all fields readable.
3. Scroll the preview to row 1650 to prove virtualisation.
4. Click Import, watch progress bar, screenshot the final summary card with the four counters.
5. Verify with a SQL read: Amra row untouched, Citi only blanks filled, one other developer's fields changed to Excel values, one brand-new developer inserted as `is_hidden=true`.
6. Trigger `enrich-developer-from-drive` on one row with a Drive link and screenshot the resulting `developer_drive_jobs` row + one new `projects` row.

Screenshots and the SQL diff go in the reply — no claim of "fixed" without them.

## One thing I need from you before step 5

To read your Drive folders I need either a **Google Drive API key** (works if folders are shared "anyone with the link") or a **service-account JSON** (works for private folders you share with the service-account email). I'll prompt for whichever you prefer with the secret tool the moment we get to the Drive step. Everything else can start immediately.
