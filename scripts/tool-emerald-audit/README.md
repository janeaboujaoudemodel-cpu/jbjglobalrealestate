# Tool Emerald Visual Regression

Screenshots every AI tool route and scans **every pixel** for two brand violations:

| Check | Definition | Threshold |
|---|---|---|
| **Champagne pixels** | RGB inside `#FDFBF7 / #F7F2EA / #EFE6D6` (± tolerance) or generic warm-cream heuristic (`r≥235, g≥225, b≥205, r>b, 6≤r-b≤55`). Tools must be emerald-only. | `400` px |
| **Dark ink on emerald** | Near-black pixels (`r,g,b<55`) on any route whose surface is ≥15 % emerald. Ink must be pure white on emerald. | `400` px |

The audit screenshots the `[data-tool-emerald]` shell element (falls back to `<main>` / full page). Per-route PNGs + `report.json` are written to `artifacts/`.

## CI exit behaviour

| Route state | Console mark | CI exit |
|---|---|---|
| Clean — no breach | `✓` | 0 (pass) |
| Breach + listed in `known-violations.json` | `⚠ [tracked:JBJ-###]` | 0 (warn only) |
| Breach + NOT in `known-violations.json` | `✗` | 1 (fail — blocks merge) |

This two-bucket model means pre-existing violations don't pollute the signal for code changed in the current PR.

## Known pre-existing violations (`known-violations.json`)

Routes that were already violating when the check first ran (PR #43, 2026-08-17) are listed in `known-violations.json` and tracked as **JBJ-029** in ROADMAP.md.

**To add a pre-existing route** (violation existed before your PR, not introduced by it):
1. Verify it was already breaching on `main` before your change.
2. Add an entry to `known-violations.json` with `route`, `breach` type (`champagne` | `darkInk` | `unknown`), and a `note`.
3. Create or reference a JBJ-### item in ROADMAP.md.
4. Include both files in the same PR.

**To close a known violation** (you've fixed the underlying component):
1. Run the audit locally and confirm the route is now `✓`.
2. Remove its entry from `known-violations.json`.
3. Update the JBJ-### item in ROADMAP.md to Resolved with the commit hash.

## Run locally
```bash
# in one shell — dev server must serve http://localhost:8080
bun run dev

# in another
python3 scripts/tool-emerald-audit/run.py
```

Auth: if `LOVABLE_BROWSER_SUPABASE_STORAGE_KEY / _SESSION_JSON / _COOKIES_JSON` env vars are present the script restores the Supabase session before navigating, so auth-gated tool routes render their shell instead of the login page.

## CI
`.github/workflows/tool-emerald-audit.yml` runs on every PR that touches tool code and uploads `artifacts/` (PNGs + report) for inspection.

## Add a new tool route
Append its route to `routes.json`. Nothing else to change.

## Tune thresholds
Edit `THRESHOLDS` inside `run.py`. Anti-alias noise usually stays well under 100 px per route; 400 gives comfortable headroom.
