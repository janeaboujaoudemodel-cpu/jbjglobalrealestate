# Contrast Regression Check

Multi-layer automated WCAG AA contrast gate that blocks PRs introducing low-contrast or invisible text.

## Layers

| Layer | What it inspects | When it runs | Speed |
|---|---|---|---|
| **Tokens** (`check-tokens.mjs`) | Every `--foreground`/`--background`-style HSL pair in `src/index.css` (light + dark themes) | Pre-commit on staged `index.css` / `tailwind.config.ts`, plus CI on every PR | <1s |
| **White-on-light** (`check-white-on-light.mjs`) | `text-white` statically nested inside a known light wrapper (`bg-white`, champagne, gold, pearl…) | CI on every PR | <1s |
| **Black-on-dark** (`check-black-on-dark.mjs`) | `text-black` (or near-black tokens like `text-zinc-900`) statically nested inside a known dark wrapper (`bg-black`, `bg-zinc-900`, …). Mirror of white-on-light. | CI on every PR | <1s |
| **Low-opacity text** (`check-low-opacity-text.mjs`) | `text-*/NN` and `opacity-NN` below 40 on text-bearing nodes — catches `text-foreground/10`, `text-black/20`, `opacity-[0.08]`, etc. that render copy effectively invisible regardless of the underlay (typical side-effect of a global CSS override). State-driven reveals (`hover:`, `disabled:`, `group-hover:`, …) are excluded. Faded icons are reported as non-blocking warnings. | CI on every PR | <1s |
| **Rendered** (`check-rendered.mjs`) | Real DOM via Playwright + axe-core's `color-contrast` rule, across the routes listed in the script | CI on every PR/push to `main` | ~2 min |

## Failure policy

**Hard-fail on any AA violation** (4.5:1 for text, 3:1 for UI). The build fails and the PR comment shows exactly which pair / DOM node / class string failed.

The GitHub Actions workflow `.github/workflows/contrast-check.yml` runs `npm run check:contrast:pr-gate` on every PR and push to `main`. Mark the **Contrast PR Gate (blocks merges)** check as a Required Status Check in branch protection so any new regression — tokens, faded-gold, low-opacity text, white-on-light, black-on-dark, or same-tone — disables the merge button.

### Same-tone baseline

`check-same-tone.mjs` compares current offenders against `scripts/contrast/same-tone-baseline.json`. Pre-existing files are tolerated; **new files or higher hit counts fail the gate**. Refresh the baseline only when an intentional change is reviewed:

```bash
node scripts/contrast/check-same-tone.mjs --print-baseline > scripts/contrast/same-tone-baseline.json
```

## Allowlist

Documented exceptions live in `scripts/contrast/allowlist.json`. Every entry **must** include a `reason`. Sections:

- `tokens[]` — `"pair": "fg-token/bg-token"` (e.g. `"muted-foreground/muted"`)
- `axeNodeSelectors[]` — CSS selectors for decorative elements
- `lowOpacityTextBaseline.entries[]` — pre-existing `file:line:kind` hits captured the day the rule landed; new regressions are blocked, historical entries are tolerated until cleaned up

Decorative DOM nodes can also opt out at runtime via `data-decorative="true"` or class `.jj-watermark`. Static checks accept a `// contrast-ok` comment on the offending line.

## Local commands

```bash
npm run check:contrast:tokens          # fast token check
npm run check:contrast:white-on-light  # static white-on-light scan
npm run check:contrast:black-on-dark   # static black-on-dark scan
npm run check:contrast:low-opacity     # static near-transparent text scan
npm run check:contrast:rendered        # needs preview at $PREVIEW_URL (default http://localhost:8080)
npm run check:contrast                 # all of the above

# Refresh the low-opacity baseline after a cleanup sweep:
node scripts/contrast/check-low-opacity-text.mjs --print-baseline
```

## Runtime guards

`src/index.css` carries paired runtime safety nets that re-color elements which slip past the static checks:

- `[data-surface="light"] .text-white` → forced to dark
- `[data-surface="dark"] .text-black` → forced to light
- Any text-bearing node ending up with alpha < 25 (`text-*/0…25` or `opacity-0…25`) is lifted back to `opacity:1; color: hsl(var(--foreground))`, except elements opting out via `data-decorative="true"` / `.jj-watermark`.

These guards are belt-and-braces — fix the source class instead of relying on them — but they prevent a global-CSS regression from making body text invisible in production.

## Adding new routes to the rendered sweep

Edit the `ROUTES` array in `scripts/contrast/check-rendered.mjs`. Owner-only routes need an authenticated fixture and are not yet covered.

## Artifacts

CI uploads `artifacts/contrast/` (tokens.json, rendered.json, rendered.md) on every run, retained 30 days.
