# Price Color Audit

Visual regression check that scans key routes, locates every price element
(`.text-price-orange`, `.jj-price`, `[data-price]`, `[data-price-badge]`,
`.price-display`, `.price-value`, `.property-price`, `.listing-price`,
`.starting-price`, plus heuristically anything matching `/AED\s?\d/` or
`/\$\s?\d/`), and flags anything whose **computed text color** is not within
tolerance of the canonical price-orange tokens:

- Light surfaces → `--price-orange` ≈ `hsl(24 95% 53%)` ≈ `#F97316`
- Dark surfaces / `.dark` → `--price-orange-glow` ≈ `hsl(24 95% 58%)` ≈ `#FB923C`
- Solid orange pills → white text on orange (intentional)

## Install

```bash
cd scripts/price-color-audit
npm install
npx playwright install chromium
```

## Run

```bash
# Local
node run.mjs

# Against the preview build
npm run audit:preview

# Against production
npm run audit:live

# Custom routes
node run.mjs --base=https://www.jbj.ae \
  --routes=/,/properties,/property-map,/resale-properties,/developers
```

## Output

- `/mnt/documents/price-color-audit.html` — visual report with screenshots
- `/mnt/documents/price-color-audit.json` — machine-readable findings

Exit code is `1` if any **fail**-severity issue is found (suitable for CI).
