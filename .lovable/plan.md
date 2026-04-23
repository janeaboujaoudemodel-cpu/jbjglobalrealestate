

## Goal

Build an automated visual icon-tile audit that:
1. Captures every "icon tile" in its **default, hover, focus, and active** states.
2. Flags any tile where the icon is **clipped, missing, low-contrast, or visually obscured**.
3. Produces a single self-contained HTML report (sandbox script) AND surfaces the latest results inside the Owner Command Center.

## Scope ("do the needful")

Auto-discover any tile across the rendered app whose DOM signature matches the JBJ tile pattern:
- A clickable container (`<a>`, `<button>`, or `[role="button"]`) **OR** a `Card` element
- Containing exactly one Lucide-style `<svg>` glyph in its visual leading position (icon size 16–64px)
- With a visible label `<span>`/`<h3>`/`<h4>` sibling

Auto-crawl entry points (sandbox script):
- `/` (homepage feature tiles)
- `/ai-hub` (Royal Tools Hub — 61 tiles)
- `/owner` (Owner Command Center grid)
- `/owner/mode-hub`
- `/owner/toolkit` → redirects to `/ai-hub` (already covered)
- `/services`, `/properties`, `/developers` (any tile grids found)
- Any additional route discovered in the app sitemap that contains ≥3 matching tiles

Each route is loaded headless, viewport 1440×900, dark + light theme runs.

## Pass / fail rules ("do the needful" — comprehensive set)

Fail a tile when **any** of:

1. **Missing icon** — container matches tile signature but no `<svg>` child.
2. **Zero-sized / clipped** — icon `getBoundingClientRect()` width or height < 12px, OR icon bbox extends outside its parent tile bbox by > 1px.
3. **Low contrast** — WCAG contrast ratio between the icon's effective stroke/fill color and the average pixel color of the tile background directly behind the icon < **3:1** (UI component threshold).
4. **Obscured glyph** — in hover/focus/active state, the icon's visible (non-transparent) pixel area drops by > 25% vs. default.
5. **Invisible glyph** — icon computed `opacity` < 0.4, `visibility:hidden`, `display:none`, or all icon pixels match the background within ΔE < 5.
6. **Color-on-color violation** — icon fill/stroke equals the tile background color exactly (common AI-generated regression).

Each failure records: route, tile selector, label text, screenshot crop (default + failing state), measured contrast ratio, bbox, and rule code.

## Architecture

### Part A — Sandbox script (CI / on-demand)

`scripts/icon-tile-audit/run.mjs` (Node + Playwright + sharp + WCAG contrast lib)

Pipeline:
1. Launch Chromium, iterate routes.
2. On each route: `page.$$eval` to discover tile signatures → returns array of selectors + bboxes.
3. For each tile: snapshot default state, then dispatch `mouseover` / `focus` / `mousedown` and re-snapshot. Crop with `sharp`.
4. Sample background pixels behind icon (median color in icon bbox masked by SVG alpha) and icon ink color (median non-alpha pixel of the SVG render). Compute WCAG contrast.
5. Apply all 6 rules → produce `results.json` + `report.html` (embedded base64 crops, summary table, per-route accordion, color-coded rule pills).
6. Output: `/mnt/documents/icon-tile-audit.html` + machine-readable `results.json`.
7. Optional `--insert-db` flag: writes a summary row into a new `icon_audit_runs` table for the dashboard.

`scripts/icon-tile-audit/README.md` — usage + rule reference.

### Part B — Owner dashboard surface

New route `/owner/icon-audit` (lazy-loaded, wrapped by existing `OwnerGuard` via `/owner` shell):

Page sections:
1. **Header** — title, "How it runs" hint, link to latest report (if URL stored).
2. **Latest run summary card** — total tiles scanned, total failures by rule, run timestamp, environment label.
3. **Failures table** — paginated, sortable by route / rule / contrast ratio. Each row expands to show the cropped before/after screenshots (rendered from base64 stored in `metadata`).
4. **Run history** — last 20 runs from `icon_audit_runs`, status pill (✅ pass / ⚠ minor / ❌ major), pages scanned, total failures.
5. **Empty state** — instructions to run the script: `node scripts/icon-tile-audit/run.mjs --insert-db`.

### Part C — Database (single new table)

Migration: `icon_audit_runs`

Columns:
- `id uuid pk`
- `run_label text` (e.g. `manual-2026-04-23` or commit SHA)
- `environment text` — `local` | `preview` | `production`
- `routes_scanned int`
- `tiles_scanned int`
- `total_failures int`
- `failures_by_rule jsonb` — `{ missing_icon: n, low_contrast: n, ... }`
- `report_url text` — optional artifact link
- `failures jsonb` — full per-tile failure objects (route, selector, label, rule, contrast, bbox, base64 crop)
- `created_at timestamptz default now()`
- `created_by uuid references auth.users(id)`

RLS: SELECT + INSERT restricted to `is_owner_or_admin(auth.uid())`. No UPDATE / DELETE (immutable log).

### Part D — Route + sidebar

- Register `/owner/icon-audit` in `src/routes/OwnerRoutes.tsx`.
- No sidebar restructuring — link is reachable via the `/owner/baseline-pdf` "QA tools" pattern already established.

## Files touched

- `scripts/icon-tile-audit/run.mjs` (new)
- `scripts/icon-tile-audit/rules.mjs` (new — pure functions, unit-testable)
- `scripts/icon-tile-audit/report-template.html` (new — embedded asset, base64 crops injected at run time)
- `scripts/icon-tile-audit/README.md` (new)
- `scripts/icon-tile-audit/package.json` (new — declares `playwright`, `sharp`, `wcag-contrast` as devDeps via the existing root package; if root install isn't desired the script self-installs into a local `node_modules` under the script folder)
- `supabase/migrations/<timestamp>_icon_audit_runs.sql` (new — table + RLS)
- `src/pages/owner/IconAuditDashboard.tsx` (new)
- `src/routes/OwnerRoutes.tsx` (add lazy import + route)
- `/mnt/documents/icon-tile-audit.html` (generated artifact — first run delivers a real report from the live preview)

## Out of scope

- Auto-fixing failures (this is a detector, not a remediator).
- Screenshotting non-tile UI (typography, photos, charts) — strictly icon tiles per the discovery signature.
- Visual diff against a baseline (covered by the existing `visual_diff_report.py` for PDF exports).
- Sidebar redesign or changes to existing owner pages.
- Wiring CI to run the script automatically — the script is on-demand; CI hookup can be added later.
- Cross-browser runs — Chromium only for v1.

