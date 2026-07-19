## What went wrong last time

The previous import ran in "enrich existing only" mode:

- Excel had **1,380 rows**
- Only **363** matched existing developers and got enriched
- The other **~1,017 rows were silently skipped** — that is why "One Development" is enriched (it existed) but hundreds of others from the sheet are missing entirely
- `is_hidden` filter also hides some cards even when they exist

You explicitly asked for the opposite: new profiles for missing developers, enrichment for existing ones, no duplicates, and a per-row before/after report you can download.

## The plan

### 1. Full staging refresh from the uploaded Excel

- Reload `Agency_Registration_-_Developers_2027-3.xlsx` (1,650 rows) into `dev_excel_staging_2027`.
- Normalize every row through `jbj_dev_canon()` (strips "developers/development/realty/estates/holding/LLC/group" etc.) to compute a canonical key per row.
- Deduplicate **inside the sheet itself** first (some names appear more than once) — keep the row with the most non-empty fields.

### 2. Classification with a locked matching rule

Every Excel row lands in exactly one bucket:

| Bucket | Rule |
|---|---|
| **Enrich** | Canonical key matches an existing developer → fill blanks only, never overwrite |
| **Protected** | Al Hamra (Amra) — skip entirely, keep manual data |
| **New** | No canonical match anywhere → create a fresh developer profile |
| **In-sheet duplicate** | Merged into the surviving row before insert |
| **Rejected** | Empty/garbage name row → excluded with reason |

Registration status and group status are ignored on both paths (per your standing rule).

### 3. Preview-before-write (mandatory approval step)

Nothing is written to `developers` until you approve. A new owner screen at `/owner/developers/import-review` shows every Excel row with:

- Bucket badge (Enrich / New / Protected / Duplicate / Rejected)
- Side-by-side **Before → After** for each field (name, founder, founded year, projects UAE, projects outside UAE, global presence, RM/CP, email, phone, address, socials, website, Google Drive, WhatsApp)
- Changed fields highlighted in gold; unchanged in muted
- Per-row checkbox + bulk "Approve all Enrich", "Approve all New", "Approve selection"
- Row-level "Skip" to exclude anything that looks wrong

Only approved rows are committed.

### 4. Write phase (idempotent, no duplicates)

- **Enrich rows**: `UPDATE` existing developer, `COALESCE`-style — only fills where the current column is NULL or empty string. Sets `excel_import_marker='2027_enriched_v2'` and stores the pre-image in `custom_fields.excel_before` so the diff is auditable.
- **New rows**: `INSERT` with `is_hidden=true` initially (draft), so no unreviewed profile leaks to the public site. Slug generated from canonical name with collision suffixing. Stores `custom_fields.excel_source_row` for traceability.
- All writes wrapped in a single transaction per batch of 100 rows.

### 5. Google Drive extraction for every affected developer

After profiles are written, for every row that had a `google_drive_url` we queue `enrich-developer-from-drive`:

- Pulls logo, brochures, fact sheets, project images
- Creates project rows (deduped by name inside that developer)
- Extracts area/community names from filenames and PDF text and links them
- Result is visible in the existing `/owner/drive-extractions` hub

### 6. Downloadable before/after report

Two artefacts generated at the end of the run and offered as downloads from the Import Review page:

- **Excel workbook** (`developer-import-report-YYYYMMDD.xlsx`) with tabs:
  - `Summary` — counts by bucket
  - `New developers` — every new profile with all fields + link to `/developer/{slug}` preview
  - `Enriched developers` — one row per developer, columns paired `field_before` / `field_after`, changed cells highlighted yellow
  - `Skipped` — protected, duplicates, rejected, with reason
- **A4 PDF report** — same content, one page per developer, printable, with logo thumbnail and clickable "View live profile" link. Landscape for the diff pages so before/after fit side by side.

Both files land in `owner-reports` storage bucket and are one-click downloadable from the review screen.

### 7. Visibility fix for the "One Development" symptom

Directory search currently does exact-substring on `name` only, so a typo ("developement") returns 0. Separately we'll:

- Extend the filter to also match `slug` and a `search_tokens` array (canonical + common misspellings)
- Show hidden drafts in the owner directory with a "Draft" badge so you can see everything

### Technical section

- SQL: rewrite `apply_dev_excel_import_2027()` into two functions — `preview_dev_excel_import_2027()` returning JSON diffs, and `commit_dev_excel_import_2027(approved_ids uuid[])` doing the writes.
- New table `dev_excel_import_review` (row_hash, canonical_key, bucket, matched_developer_id, before jsonb, after jsonb, decision, decided_at, decided_by).
- Report generation via a new edge function `generate-developer-import-report` using `exceljs` + `pdf-lib`, writing to a new private `owner-reports` bucket with signed URLs.
- Frontend: new page `src/pages/owner/DeveloperImportReview.tsx` + route in `OwnerRoutes.tsx`, wired from the existing `DeveloperExcelImportDialog`.
- Drive extraction reuses the existing `enrich-developer-from-drive` and `enrich-all-drives` functions — only the queueing call is added.

### Deliverable checklist

- [ ] All 1,650 Excel rows visible and classified in the review screen
- [ ] Zero duplicates: canonical key uniqueness enforced across sheet + DB
- [ ] Before/after visible per row in the UI
- [ ] Excel + A4 PDF report downloadable
- [ ] Drive folders scanned for every affected developer
- [ ] Al Hamra untouched
- [ ] Registration / group status fields untouched
- [ ] Hidden drafts findable from the owner directory
