# PDF Export QA Gate

Automated print/PDF check that runs in CI on every push and pull request.
Generates each registered PDF export, validates it against edge-coverage
and DPI thresholds, and **fails the build** when violations are reported.

## What it checks

For every export listed in `check-exports.mjs`:

1. **Download succeeds** — the export route returns a non-empty PDF.
2. **Page integrity** — `pdfinfo` reports at least one page.
3. **Edge coverage** — pages are rasterized at 150 DPI; any non-white pixel
   inside the configured margin band counts as bleed. Fails if the ratio
   exceeds `edgePixelTolerancePct`.
4. **DPI floor** — `pdfimages -list` is parsed; any embedded image below
   `minImageDpi` fails the export.

A `report.json` and human-readable `report.md` are written to
`artifacts/pdf-qa/` and uploaded as a workflow artifact on every run.

## Run locally

Requires `poppler-utils` (`pdftoppm`, `pdfimages`, `pdfinfo`) and Playwright
Chromium.

```bash
# install poppler (macOS)
brew install poppler

# install playwright browsers
npx playwright install chromium

# build + serve, then run the gate against the preview
npm run build
npm run preview &     # serves on http://localhost:8080
npm run pdf:qa
```

## Adding a new export

Append an entry to the `EXPORTS` array in `check-exports.mjs`:

```js
{
  id: "my-export",
  label: "My Export",
  type: "download",                       // or "static"
  downloadRoute: "/__qa/my-export",       // deterministic test route
  downloadSelector: '[data-qa="download-my-pdf"]',
}
```

For exports that require auth or dynamic data, expose a deterministic
`/__qa/<id>` route (only mounted in dev / preview builds) that renders the
target component with seeded data and a single download trigger.

## Tuning thresholds

Edit `thresholds.json`. `defaults` apply to every export and per-export
overrides go under `exports.<id>`:

```json
{
  "defaults":   { "edgeMarginPt": 36, "edgePixelTolerancePct": 0.5, "minImageDpi": 150 },
  "exports": {
    "investor-portfolio": { "edgeMarginPt": 28, "edgePixelTolerancePct": 0.75 }
  }
}
```

| Field                   | Meaning                                                   |
| ----------------------- | --------------------------------------------------------- |
| `edgeMarginPt`          | Safe-zone margin in points (1 pt = 1/72 in).              |
| `edgePixelTolerancePct` | Max % of margin-band pixels allowed to be non-white.      |
| `minImageDpi`           | Smallest acceptable embedded image DPI.                   |
| `minPages`              | Minimum page count.                                       |

## CI

`.github/workflows/pdf-export-qa.yml` runs on every `push` to `main`,
every pull request, and `workflow_dispatch`. The job exits non-zero on
violation and posts the `report.md` summary as a PR comment.
