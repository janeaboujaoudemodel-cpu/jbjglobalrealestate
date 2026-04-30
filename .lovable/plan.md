# Automated Accessibility Checks (focus order, ARIA, keyboard nav, contrast)

## What exists today

Color contrast is already covered in depth. There is a full multi-layer suite under `scripts/contrast/` plus the `check:contrast` npm script — that work continues unchanged. The four user-requested categories that are NOT yet automated are:

1. ARIA / a11y rule violations (other than `color-contrast`)
2. Focus order (tab order matches reading order, no traps)
3. Keyboard navigation (every interactive control is reachable + activatable)
4. Visible focus indicators

Project already has the tooling installed: `axe-core@4.11`, `@playwright/test@1.58`, `@testing-library/*`, `vitest`-compatible setup. We reuse `scripts/contrast/check-rendered.mjs` as the architectural blueprint (Playwright + axe + allowlist + JSON/MD report under `artifacts/`).

## Architecture

Three new layers, mirroring the existing contrast suite's split between fast static checks and a slower rendered sweep:

```text
scripts/a11y/
├── check-aria.mjs            (rendered, axe full ruleset minus color-contrast)
├── check-keyboard.mjs        (rendered, Playwright tab walk + focus-visible probe)
├── check-static-aria.mjs     (static AST scan: missing aria-label on icon-only buttons)
├── allowlist.json            (per-rule + per-selector waivers, mirrors contrast/allowlist.json)
└── README.md                 (how to run, refresh baseline, interpret reports)

artifacts/a11y/                (generated, gitignored)
├── aria.{json,md}
├── keyboard.{json,md}
└── static-aria.{json,md}
```

Each script writes a Markdown summary suitable for PR comments and exits non-zero on any non-allowlisted violation.

## Layer 1 — Static AST scan (sub-second, runs in lint-staged)

`scripts/a11y/check-static-aria.mjs` walks `.tsx` files and flags the cheap, deterministic mistakes that cause icon-only controls to be unreadable to screen readers:

- `<button>` / `<a>` whose only child is a `<lucide-*>` icon and lacks `aria-label`, `aria-labelledby`, or visible text.
- `<img>` without `alt` (empty string is fine — explicit decorative).
- `<input>` without `id` paired to a `<label htmlFor>` (or `aria-label` / `aria-labelledby`).
- Custom interactive `<div onClick>` / `<span onClick>` without `role`, `tabIndex`, or `onKeyDown`.

Uses regex-based scanning (same approach as `check-faded-gold.mjs` and `check-low-opacity-text.mjs`) — no full TS AST needed, fast enough for pre-commit. Allowlist supports per-file-line waivers.

## Layer 2 — Rendered ARIA sweep (Playwright + axe-core)

`scripts/a11y/check-aria.mjs` clones the `check-rendered.mjs` pattern but runs the full WCAG 2.1 AA axe ruleset **excluding** `color-contrast` (already covered):

```js
axe.run(document, {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  rules: { 'color-contrast': { enabled: false } },
  resultTypes: ['violations'],
});
```

This catches: `aria-required-children`, `aria-roles`, `button-name`, `link-name`, `image-alt`, `label`, `landmark-one-main`, `region`, `duplicate-id-aria`, `tabindex`, `frame-title`, `html-has-lang`, etc.

Routes covered match the contrast sweep (`/`, `/properties`, `/areas`, `/ai-hub`, `/about`, `/contact`, `/legal/terms`, `/legal/privacy`, `/market-intelligence`, `/property-map`, `/developers`). Authenticated routes deferred to a follow-up that introduces a Playwright auth fixture.

Allowlist format:
```json
{
  "rules": {
    "region": { "reason": "Marketing pages use multiple top-level wrappers", "waived": false }
  },
  "axeNodeSelectors": [
    { "selector": "[data-radix-scroll-area-viewport]", "rule": "scrollable-region-focusable", "reason": "Radix internals" }
  ]
}
```

## Layer 3 — Keyboard navigation + focus order

`scripts/a11y/check-keyboard.mjs` (Playwright) does three probes per route:

1. **Reachability** — tabs through every focusable element and asserts that the count matches `document.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])').length`. Catches `tabindex="-1"` traps and `display: none` mismatches.
2. **Visible focus** — for each tab stop, reads `getComputedStyle(:focus-visible)` and asserts that *one of* `outline-width >= 2px`, `box-shadow` non-empty, or a ring class is present. Flags any focusable element with no visible focus indicator (a frequent regression when components override `outline: none`).
3. **Reading-order sanity** — captures DOMRect of each tab stop in tab order and asserts the sequence is monotonically non-decreasing in `(top, left)` within ~50px tolerance per row. Rejects layouts where tab jumps backward up the page (a strong signal of misordered DOM or CSS reorder via flex `order` / grid placement).

Per-route waivers in the allowlist for legitimate exceptions (e.g., a "Skip to content" link is tab-stop 1 even though it is visually offscreen until focus).

## CI wiring

`package.json` additions:

```json
"check:a11y:static": "node scripts/a11y/check-static-aria.mjs",
"check:a11y:aria":   "node scripts/a11y/check-aria.mjs",
"check:a11y:keyboard": "node scripts/a11y/check-keyboard.mjs",
"check:a11y": "npm run check:a11y:static && npm run check:a11y:aria && npm run check:a11y:keyboard",
"check:quality": "npm run check:contrast && npm run check:a11y"
```

The fast static scan also runs in `lint-staged` so regressions are blocked at commit time without requiring a preview server.

The two rendered sweeps require `PREVIEW_URL` (defaulting to `http://localhost:8080`, identical contract to the existing rendered contrast script) so they run against either a local `vite preview` or the deployed Lovable preview URL.

## Baseline strategy

Same approach as contrast: run each check once, capture every existing finding into `scripts/a11y/allowlist.json` with `"baseline": true` and a `reason` field. CI then **only fails on new violations**, while a separate flag (`--print-new-baseline`) regenerates the file. This lets us turn the gates on immediately without a giant cleanup PR, while making any future regression a hard fail.

## Acceptance criteria

- Three new scripts under `scripts/a11y/` with shared `allowlist.json` and a `README.md`.
- `npm run check:a11y` runs all three and exits non-zero on any non-baseline violation.
- Pre-commit hook (`lint-staged`) runs `check:a11y:static` on changed `.tsx` files.
- Markdown reports in `artifacts/a11y/` suitable for posting to PRs (matching the existing contrast artefact pattern).
- No changes to application code in this pass — purely the test infrastructure plus a recorded baseline. Any cleanups discovered during baseline generation are noted in the report but not auto-fixed (separate PR per the No Removal policy).

## Out of scope (follow-ups)

- Authenticated routes (need a Playwright auth fixture). Once available, add `/dashboard/*`, `/admin/*`, `/crm/*` to the route list.
- Mobile-viewport sweep (current sweep is 1440x900). Add a 390x844 pass behind `A11Y_VIEWPORT=mobile`.
- Screen-reader announcement diffs (axe doesn't cover live-region semantics deeply). Could be added later via Playwright + `aria-live` snapshotting.
- A new memory entry under `mem://ui-ux/visual-standards/automated-a11y-suite` linking the three layers — to be added once the suite lands and is green.
