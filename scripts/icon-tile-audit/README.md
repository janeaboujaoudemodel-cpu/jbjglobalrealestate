# Icon Tile Audit

Automated visual check that screenshots every icon tile across the app in
default / hover / focus / active states and flags any case where the icon is
missing, clipped, low-contrast, obscured, invisible, or color-on-color.

## Setup

```bash
cd scripts/icon-tile-audit
npm init -y
npm i playwright sharp @supabase/supabase-js
npx playwright install chromium
```

## Run

Local dev server:

```bash
node scripts/icon-tile-audit/run.mjs --base=http://localhost:8080
```

Live preview, posting results to the owner dashboard:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/icon-tile-audit/run.mjs \
  --base=https://www.jbj.ae \
  --routes=/,/ai-hub,/owner,/owner/mode-hub \
  --insert-db --label=manual-$(date +%F) --env=preview
```

Outputs:
- `/mnt/documents/icon-tile-audit.html` — full visual report
- `/mnt/documents/icon-tile-audit.json` — machine-readable summary
- (optional) one row in `icon_audit_runs` viewable at `/owner/icon-audit`

Exit code: `1` if any **major** rule fires (missing icon, low contrast,
invisible glyph) — suitable for CI gating.

## Rules

| Code | Description | Threshold |
| ---- | ----------- | --------- |
| `missing_icon` | Tile matches signature but has no `<svg>` child | — |
| `clipped` | Icon < 12px, or extends outside parent tile | bbox |
| `low_contrast` | Icon vs background WCAG contrast ratio | < 3:1 |
| `obscured` | Hover/focus/active state hides > 25% of glyph pixels | 25% drop |
| `invisible` | opacity < 0.4, hidden, or icon ≈ background (ΔE<5) | — |
| `color_on_color` | Icon fill/stroke equals background exactly | — |

See `rules.mjs` for pure unit-testable rule functions.
