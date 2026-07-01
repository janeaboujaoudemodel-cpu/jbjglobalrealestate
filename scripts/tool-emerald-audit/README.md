# Tool Emerald Visual Regression

Screenshots every AI tool route and scans every pixel for:

- **Champagne violations** — any pixel inside `#FDFBF7 / #F7F2EA / #EFE6D6` (± tolerance) or a generic warm-cream heuristic. Tools must be emerald-only.
- **Dark ink on emerald** — near-black pixels on routes whose surface is ≥15% emerald. Ink must be pure white.

Screenshots the `[data-tool-emerald]` shell element (falls back to `<main>` / full page). Writes per-route PNGs + `report.json` under `artifacts/`.

## Run locally
```bash
# in one shell
bun run dev   # or: npm run dev  (must serve on http://localhost:8080)

# in another
node scripts/tool-emerald-audit/run.mjs
```

Non-zero exit ⇒ at least one route breached the thresholds in `run.mjs → THRESHOLDS`.

## CI
`.github/workflows/tool-emerald-audit.yml` runs on every PR that touches tool code and uploads `scripts/tool-emerald-audit/artifacts/` as an artifact for inspection.

## Add a new tool
Append its route to `routes.json`. No other change needed.
