

## Goal

Add an owner-only dashboard page at `/owner/baseline-pdf` that displays the **Company Profile baseline PDF** metadata — file size, expected DPI thresholds, SHA-256 hash, page count, last render timestamp — plus a panel linking to the most recent visual diff comparison results.

## Approach

A single new React page, owner-gated (using existing `OwnerGuard`), backed by a new lightweight Supabase table `pdf_baseline_runs` that stores the result of each visual-diff or QA run. The page reads the baseline file's static metadata directly (HEAD request + client-side SHA-256 over the fetched bytes) and queries the runs table for the latest comparison.

## Changes

### 1. New table: `pdf_baseline_runs`

Columns:
- `id uuid pk`
- `export_id text` — e.g. `company-profile`
- `baseline_sha256 text`
- `baseline_size_bytes bigint`
- `baseline_page_count int`
- `candidate_label text` — free-form (e.g. filename or "baseline-vs-baseline")
- `candidate_sha256 text`
- `result_status text` — `pass` | `fail` | `identical` | `minor` | `moderate` | `major`
- `pages_compared int`, `pages_changed int`, `avg_changed_pct numeric`
- `report_url text` — optional link to the generated HTML report (e.g. uploaded artifact URL)
- `metadata jsonb` — full per-page summary if needed
- `created_at timestamptz default now()`
- `created_by uuid references auth.users(id)` (nullable for CI runs)

RLS:
- INSERT allowed for `is_owner_or_admin()` (re-uses existing helper).
- SELECT restricted to `is_owner_or_admin()`.
- No UPDATE / DELETE policies (immutable log).

### 2. New page: `src/pages/owner/BaselinePdfDashboard.tsx`

Sections:
1. **Header card** — title + "Open Clean Preview" (already exists in CompanyProfileDownload, reused as link).
2. **Baseline metadata card** — fetches `/documents/JBJ-Global-Real-Estate-Company-Profile.pdf` once, computes SHA-256 client-side via `crypto.subtle.digest`, parses page count via PDF byte-string scan (`/Type /Page` count) — no external dep needed; falls back to "—" if not parseable.
   - Displays: filename, size (KB / MB), SHA-256 (with copy button), page count, expected DPI floor (150 — read from a small static config), expected page count (18, hard-coded spec), and "Last fetched at" timestamp (now).
3. **Last comparison card** — queries `pdf_baseline_runs` for the most recent row where `export_id = 'company-profile'` and shows: candidate label, status pill, pages compared / changed, avg %, link to `report_url` if present, timestamp.
4. **Recent runs table** — last 10 rows, sortable by date.
5. **Empty state** — friendly message if no runs yet, with one-line instructions on how to log one (the existing visual-diff script can be extended later to insert; out of scope for this task).

### 3. Route registration

Add the page to the existing owner routes block (alongside other `/owner/*` routes, wrapped by `OwnerGuard`).

### 4. Sidebar/menu entry (optional, low-risk)

Add a single nav entry under the existing owner tools section linking to `/owner/baseline-pdf`. If the owner sidebar uses a static array, append one item; otherwise this step is skipped to avoid touching unrelated layout code.

## Files touched

- `supabase/migrations/<timestamp>_pdf_baseline_runs.sql` (new) — table + RLS
- `src/pages/owner/BaselinePdfDashboard.tsx` (new)
- `src/App.tsx` — register route
- (optional) one owner-sidebar config file — single nav item

## Out of scope

- Wiring the visual-diff script to write rows into `pdf_baseline_runs` (the page reads runs; producers can be added later — manual SQL inserts work in the meantime).
- Hosting / uploading the generated HTML report to storage — `report_url` is just stored if provided.
- Comparing multiple baselines or non-Company-Profile exports (single-export dashboard for now; structure supports more by `export_id` later).
- Sidebar restructuring or any visual redesign of existing owner pages.

