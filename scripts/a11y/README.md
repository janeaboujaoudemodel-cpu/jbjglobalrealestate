# Automated Accessibility Suite

Three layers, mirroring `scripts/contrast/`:

| Layer | Script | Speed | Runs in |
|---|---|---|---|
| Static AST scan | `check-static-aria.mjs` | <1s | `lint-staged` pre-commit + CI |
| Rendered ARIA sweep | `check-aria.mjs` | ~30–60s | CI (needs preview server) |
| Keyboard / focus order | `check-keyboard.mjs` | ~30–60s | CI (needs preview server) |

Color contrast is intentionally **not** here — it's already covered by `scripts/contrast/` and its `check-rendered.mjs` runs the `color-contrast` axe rule. The ARIA sweep here disables `color-contrast` to avoid double-reporting.

## Running locally

```bash
# 1. Static scan only (no server needed):
npm run check:a11y:static

# 2. Full suite — needs the app running on PREVIEW_URL (default localhost:8080):
npm run dev &      # or: npm run preview
npm run check:a11y

# 3. Against the deployed preview:
PREVIEW_URL=https://id-preview--<project>.lovable.app npm run check:a11y
```

Reports land in `artifacts/a11y/` (gitignored): `static-aria.{json,md}`, `aria.{json,md}`, `keyboard.{json,md}`. The `.md` files are formatted for PR comments.

## Layer 1 — Static scan (`check-static-aria.mjs`)

Fast regex sweep of `src/**/*.{tsx,jsx}`. Catches:

- **`button-name`** — `<button>` / `<a>` / `<Button>` / `<Link>` whose only content is an icon component, with no `aria-label`, `aria-labelledby`, `title`, or visible text.
- **`image-alt`** — `<img>` without an `alt` attribute. (`alt=""` is fine — explicit decorative.)
- **`click-events-have-key-events`** — `<div onClick>` / `<span onClick>` missing `role` + `tabIndex` + `onKeyDown`.

This is a heuristic, not a full TS AST — false positives go in `staticAriaBaseline.entries` in `allowlist.json`.

## Layer 2 — Rendered ARIA sweep (`check-aria.mjs`)

Playwright + axe-core, full WCAG 2.1 AA + best-practice ruleset, **excluding** `color-contrast`. Loads the public route list, runs `axe.run`, filters via `allowlist.json`.

Catches: `button-name`, `link-name`, `image-alt`, `label`, `aria-required-children`, `aria-roles`, `aria-valid-attr`, `landmark-one-main`, `region`, `duplicate-id-aria`, `tabindex`, `frame-title`, `html-has-lang`, etc.

Authenticated routes are excluded for now — they need a Playwright auth fixture (follow-up).

## Layer 3 — Keyboard / focus order (`check-keyboard.mjs`)

Per route:

1. **Reachability** — counts focusable elements via the WAI selector, then presses Tab up to 250 times and asserts the walked count matches within ±10%. Detects `tabindex="-1"` traps and `display:none` mismatches.
2. **Focus-visible** — for each tab stop, requires *one of* outline ≥ 2px, non-empty `box-shadow`, or a `ring*` class on the element. Catches components that override `outline: none` without restoring a ring.
3. **Reading order** — flags backward vertical jumps > 80px between consecutive tab stops (signal of bad flex `order`, grid placement, or DOM-vs-visual mismatch).

Per-route waivers go in `keyboardRouteWaivers` in `allowlist.json` (e.g., a "Skip to content" link that intentionally tabs first while sitting offscreen).

## Refreshing the baseline

Each script supports `--print-baseline` to regenerate its baseline list. Use only after fixing or explicitly waiving the regressions you intend to keep:

```bash
node scripts/a11y/check-static-aria.mjs --print-baseline > /tmp/static.json
PREVIEW_URL=http://localhost:8080 node scripts/a11y/check-aria.mjs --print-baseline > /tmp/aria.json
PREVIEW_URL=http://localhost:8080 node scripts/a11y/check-keyboard.mjs --print-baseline > /tmp/keyboard.json
```

Then merge the relevant `entries` arrays into `scripts/a11y/allowlist.json` under `staticAriaBaseline`, `ariaBaseline`, and `keyboardBaseline` respectively. **Do not blindly overwrite** — review each new entry to confirm it is a tolerated historical finding and not a regression introduced by your branch.

## Out of scope (follow-ups)

- Authenticated routes (`/dashboard`, `/admin`, `/crm`) — need a Playwright auth fixture.
- Mobile viewport sweep (currently 1440×900). Add a 390×844 pass under `A11Y_VIEWPORT=mobile`.
- Live-region / `aria-live` announcement diffs — axe doesn't cover this deeply.
