# Tool Emerald Visual Regression

Screenshots every AI tool route and scans **every pixel** for two brand violations:

| Check | Definition | Threshold |
|---|---|---|
| **Champagne pixels** | RGB inside `#FDFBF7 / #F7F2EA / #EFE6D6` (± tolerance) or generic warm-cream heuristic (`r≥235, g≥225, b≥205, r>b, 6≤r-b≤55`). Tools must be emerald-only. | `400` px |
| **Dark ink on emerald** | Near-black pixels (`r,g,b<55`) on any route whose surface is ≥15 % emerald. Ink must be pure white on emerald. | `400` px |

The audit screenshots the `[data-tool-emerald]` shell element (falls back to `<main>` / full page). Per-route PNGs + `report.json` are written to `artifacts/`.

Any route with `hasShell=true` that breaches either threshold makes the run exit non-zero.

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

## Add a new tool
Append its route to `routes.json`. Nothing else to change.

## Tune thresholds
Edit `THRESHOLDS` inside `run.py`. Anti-alias noise usually stays well under 100 px per route; 400 gives comfortable headroom.
