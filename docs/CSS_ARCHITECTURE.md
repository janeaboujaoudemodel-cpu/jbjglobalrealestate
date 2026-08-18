# CSS architecture — JBJ-017

## Why this exists

`src/index.css` is ~32,700 lines and growing, and is the direct, traceable
cause of most of the contrast/color regressions that keep showing up (see
`CLAUDE.md`). The fastest way this file keeps growing is a new override
landing as `!important` instead of fixing the specificity conflict it's
papering over. JBJ-017 puts a floor under that: stop the count from
climbing further while the CRM-extraction pilot and other de-risking work
happens separately.

## What's frozen, and what isn't

`scripts/css-guard.mjs` counts every `!important` occurrence across
`src/**/*.css`, **excluding `src/index.css`**, and compares it against a
baseline constant (`BASELINE`, currently `6460`) defined in the script
itself.

`index.css` is excluded from the guard's count because it is a
compiled/bundled output that already contains the rules from the
individual source stylesheets — counting both would double-count the same
`!important` declarations. `index.css` itself carries roughly 8,000
additional `!important` occurrences on top of the 6,460 counted here; it
is out of scope for this guard, not zero.

- **This is a ceiling, not a target.** The guard does not require reducing
  the count — it only fails (`--ci`) when the count goes *above* baseline.
- **The baseline is not "whatever the count happens to be."** It was set at
  a point in time by whoever ran this audit. If the live count is already
  above baseline when you read this, that gap is pre-existing drift the
  guard is meant to surface — not something to silently fix by bumping
  `BASELINE` up to match. Bumping the baseline is a deliberate, reviewed
  decision (see "Changing the baseline" below), not a reflex.
- Run `npm run check:css:guard` to see the live count and the top files by
  `!important` usage. Add `--ci` to make it exit non-zero when over
  baseline — that's what CI should use.

## Why `!important` isn't banned outright by stylelint

`.stylelintrc.json` extends `stylelint-config-standard` but turns off
`declaration-no-important`. A hard lint ban would fail on every one of the
existing occurrences (~6,460 in source files, plus ~8,000 more in the
compiled `index.css`) with no incremental path forward, which makes the
lint step useless (nobody can get it green, so it gets skipped or
`--no-verify`'d). The count-based guard is the actual enforcement
mechanism; the stylelint config is for catching new stylistic issues
(duplicate properties, invalid values, etc.) in files that are touched.

Several `stylelint-config-standard` rules that would otherwise flag
essentially all of the existing codebase (BEM-unfriendly class names,
descending specificity, custom property naming, etc.) are also turned off
in `.stylelintrc.json` for the same reason — they're about codebase-wide
conventions this repo hasn't adopted, not about correctness.

## Adding new CSS

- Prefer a component-scoped stylesheet or Tailwind utility classes over
  adding to `src/index.css`. See `docs/contrast-system.md` for the
  canonical surface tones (Page/Champagne/Gold/Ink) and the WCAG AA
  contract (4.5:1 general text, 3:1 for large gold text) before touching
  contrast-sensitive styles.
- Before reaching for `!important`, check whether the actual problem is a
  specificity conflict that can be fixed by scoping the selector or
  reordering imports instead.
- If `!important` is genuinely necessary, adding it will not fail CI as
  long as the total stays at or under the frozen baseline. If your change
  pushes the count over baseline, `npm run check:css:guard -- --ci` will
  fail and tell you by how much and where the largest offenders are.

## Changing the baseline

Only raise `BASELINE` in `scripts/css-guard.mjs` as a deliberate, reviewed
decision — e.g. a large legitimate migration that adds a known, audited
batch of `!important` rules. Record the change in `ROADMAP.md` (JBJ-017)
with the old count, new count, and why, the same way any other tracked
item's status change is recorded.

## Commands

| Command | What it does |
| --- | --- |
| `npm run lint:css` | Runs stylelint against `src/**/*.css`. |
| `npm run check:css:guard` | Reports the live `!important` count vs. baseline (report-only, exits 0). |
| `npm run check:css:guard -- --ci` | Same, but exits 1 if the count is above baseline. Use this in CI. |
