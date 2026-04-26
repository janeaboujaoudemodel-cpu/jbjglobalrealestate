# Contrast Regression Check

Two-layer automated WCAG AA contrast gate that blocks PRs with low-contrast icons or text.

## Layers

| Layer | What it inspects | When it runs | Speed |
|---|---|---|---|
| **Tokens** (`check-tokens.mjs`) | Every `--foreground`/`--background`-style HSL pair in `src/index.css` (light + dark themes) | Pre-commit on staged `index.css` / `tailwind.config.ts`, plus CI on every PR | <1s |
| **Rendered** (`check-rendered.mjs`) | Real DOM via Playwright + axe-core's `color-contrast` rule, across the routes listed in the script | CI on every PR/push to `main` | ~2 min |

## Failure policy

**Hard-fail on any AA violation** (4.5:1 for text, 3:1 for UI). The build fails and the PR comment shows exactly which pair / DOM node failed.

## Allowlist

Documented exceptions live in `scripts/contrast/allowlist.json`. Every entry **must** include a `reason`. Two kinds:

- `tokens[]` — `"pair": "fg-token/bg-token"` (e.g. `"muted-foreground/muted"`)
- `axeNodeSelectors[]` — CSS selectors for decorative elements

Decorative DOM nodes can also opt out at runtime via `data-decorative="true"`.

## Local commands

```bash
npm run check:contrast:tokens     # fast token check
npm run check:contrast:rendered   # needs preview at $PREVIEW_URL (default http://localhost:8080)
npm run check:contrast            # both
```

## Adding new routes to the rendered sweep

Edit the `ROUTES` array in `scripts/contrast/check-rendered.mjs`. Owner-only routes need an authenticated fixture and are not yet covered.

## Artifacts

CI uploads `artifacts/contrast/` (tokens.json, rendered.json, rendered.md) on every run, retained 30 days.
