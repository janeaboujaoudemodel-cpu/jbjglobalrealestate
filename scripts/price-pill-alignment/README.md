# Price Pill Alignment Audit

Visual regression check for `.price-pill-premium` across breakpoints. Run before deploy to catch any drift from the locked spec.

## Spec (baseline)

| Viewport | Width | Height |
|----------|-------|--------|
| Mobile (<768px) | 96px | 40px |
| Tablet (768-1023px) | 100px | 40px |
| Desktop (≥1024px) | 104px | 40px |

Typography: eyebrow 10px/700/uppercase, value 14px/800/tabular-nums.

## Run locally

```bash
node scripts/price-pill-alignment/run.mjs --base=http://localhost:8080
```

## Run against production

```bash
node scripts/price-pill-alignment/run.mjs \
  --base=https://www.jbj.ae \
  --routes=/,/properties,/resale-properties,/developers
```

## Output

- `/mnt/documents/price-pill-alignment.html` — visual report
- `/mnt/documents/price-pill-alignment.json` — machine-readable results
- Exit code `1` when any pill drifts beyond ±1.5px or typography breaks → CI fails.

## What it checks

1. Per-pill width/height match per-viewport baseline (±1.5px)
2. Per-route width spread across all pills ≤1.5px (cross-card consistency)
3. No text overflow / clipping (`scrollWidth ≤ clientWidth`)
4. Eyebrow + value font-size and font-weight match the locked tokens

## Wiring into CI

Add to your CI pipeline (after Vite build + preview server boot):

```yaml
- name: Price pill alignment regression
  run: node scripts/price-pill-alignment/run.mjs --base=http://localhost:4173
```
