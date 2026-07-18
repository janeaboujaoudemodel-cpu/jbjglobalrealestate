
# Developer Excel Import — Rebuild + Google Drive AI Enrichment

## What's broken right now (confirmed from your two screenshots)

- Every mapping row shows `__EMPTY` / "ignore": the parser used row 1 of your file, which is the title "DEVELOPER'S REGISTRATION MONITORING" — not the real header row.
- Preview is hardcoded to the first 5 rows; you want to scroll all 1,650.
- The mapping dropdown uses a native `<select>`, so hovering shows a blue OS ring (breaks the site's no‑blue rule).
- Bottom footer shows `Import 1650 rows`; you want `Import <unique developers>`.
- No drag‑and‑drop — only the "Choose file" button, and it wraps into a broken vertical stack at your zoom.
- No `Google Drive` field, no AI pipeline reading those folders.
- Current merge rule is "fill blanks only for everyone" — the opposite of what you asked for.

## The merge rules I will implement (locked)

Key = normalized slug of the developer name; fallback = case‑insensitive name.

| Developer | Rule |
| --- | --- |
| **Amra** | Never touched. Row skipped entirely. |
| **Citi Developers** | Fill‑blanks‑only. Existing non‑empty fields kept. |
| Everyone else — already in DB | **Excel wins.** Non‑empty Excel cells overwrite existing fields. **Empty Excel cells never wipe existing data.** |
| Everyone else — new | Inserted as `is_hidden = true` so you can review before publishing. |

Zero duplication: dedupe by normalized slug before writing.

## Rebuilt import dialog

- **Drag & drop the file anywhere on the drop zone** + click‑to‑pick. Accepts `.xlsx`, `.xls`, `.csv`.
- **Smart header detection**: scans the first ~10 rows and picks the row that best matches known aliases (Name, Developer, Website, CEO, Founder, Founding Date, Description, Phone, Email, LinkedIn, Instagram, Projects, Specialization, Parent, Logo, **Google Drive**). Everything above that row is discarded — this is what fixes the "empty empty ignore ignore" screen.
- **Column mapping** uses the shadcn `Select` (champagne surface, emerald+white hover, no blue anywhere).
- **Preview shows ALL rows**, virtualised with `@tanstack/react-virtual` so 1,650 rows scroll smoothly. Sticky header, monospaced cells, no vertical wrapping.
- **Footer summary card** (the counts you asked for):
  - `1650 rows in file · 612 unique developers · 48 new · 561 will be enriched · 3 protected (Amra / Citi rules)`
  - Primary button reads **`Import 612 developers`** — never the row count.
- **Progress bar** during import (batched every 25 rows) — the UI never freezes.
- Buttons re‑laid on their own row so "Choose another file" and "Import …" never clip.

## Import engine (client → edge function)

- New edge function `bulk-import-developers` (owner‑only, service role).
- Client uploads the parsed JSON payload once; the function processes batches of 50 with a single `SELECT` per batch (not per row), applies the rule table, and returns `{ created, updated_excel_wins, filled_only_citi, protected_amra, total_unique }`.
- Idempotent: re‑uploading the same file with no changes writes nothing.

## New field: `google_drive_url` + AI enrichment pipeline

Migration:

```text
developers.google_drive_url         text
developers.drive_enrichment_status  text  -- queued | running | done | failed
developers.drive_last_synced_at     timestamptz
```

New table `developer_drive_jobs` (RLS: owner + service‑role) tracks each scan:
`developer_id, folder_url, status, discovered_projects, discovered_documents, error, timestamps`.

New edge function `enrich-developer-from-drive`:

1. Lists files in the shared Drive folder (needs one Drive credential — see "One thing I need from you" below).
2. For each PDF / DOCX / image: parse and feed the text to Lovable AI (`google/gemini-2.5-flash`) with a strict JSON schema to extract:
   - Company profile → enriches developer bio, CEO, founding year, HQ, specialization (respecting Amra/Citi rules).
   - Project brochures → creates `projects` rows (dedupe by name + developer), attaches area/community, uploads the brochure to the `project-documents` bucket, links via `project_documents`.
   - Area / community fact sheets → creates or enriches `areas` and `communities`.
   - Source files also stored in `developer_documents` so end‑users can download the books/brochures from the developer page.
3. Reuses the existing project extraction AI you already have (same one that powers "Rebuild from site") — I only point it at Drive‑sourced text instead of scraped HTML. Nothing new model‑side.
4. Auto‑runs on Excel import for every row that has a Drive link; also re‑runs on demand from the developer profile via a **Sync Google Drive** button.

## Files I will touch (nothing else)

- `src/components/owner/DeveloperExcelImportDialog.tsx` — full rewrite (drag‑drop, smart headers, virtualised preview, shadcn Select, deduped counts, progress bar).
- `supabase/functions/bulk-import-developers/index.ts` — new.
- `supabase/functions/enrich-developer-from-drive/index.ts` — new.
- One migration: add the three developer columns; create `developer_drive_jobs` with GRANTs and RLS.
- `src/pages/admin/DeveloperProfilePage.tsx` — add the "Sync Google Drive" button + status pill (isolated addition).
- `src/pages/developer-hub-admin/DeveloperDirectory.tsx` — wire the new dialog result toast to show deduped counts.

## Locked constraints

- Amra: never touched.
- Citi Developers: fill blanks only.
- All other existing developers: Excel wins on non‑empty cells; empty cells never wipe.
- Zero duplication (dedupe by slug).
- No blue anywhere (shadcn Select on champagne + emerald accent).
- Nothing outside the file list above is modified.

## End‑to‑end test I will run before saying it's done (screenshots + SQL diff in the reply)

1. Playwright: open `/owner/developers`, drag the Excel into the drop zone — screenshot showing real headers (no `__EMPTY`).
2. Screenshot the mapping grid — no blue, champagne surface, emerald hover.
3. Scroll preview to row 1,650 to prove virtualisation.
4. Click Import, watch progress, screenshot final summary with the four counters.
5. SQL read: Amra row untouched, Citi only blanks filled, one other developer changed to Excel values, one brand‑new developer inserted as `is_hidden = true`.
6. Trigger `enrich-developer-from-drive` on one row that has a Drive link and screenshot the new `developer_drive_jobs` row + one new `projects` row.

## One thing I need from you before step 6

To read your Drive folders I need one of:
- a **Google Drive API key** (works if folders are shared "anyone with the link"), or
- a **service‑account JSON** (works for private folders you share with the service‑account email).

I'll prompt for whichever you prefer with the secure secret form the moment we reach the Drive step. Everything else (dialog rebuild, merge rules, dedupe, counts, migration, bulk‑import function) starts immediately and does not need this key.
