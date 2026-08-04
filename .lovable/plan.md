# CSS Architecture Refactor — Migration Plan

No code changes are included here. This document is the architecture proposal only.

## 1. Verified starting state

Measured on the current codebase:

| Metric | Count |
| --- | --- |
| `src/index.css` lines | 37,446 |
| `!important` declarations | 11,073 |
| `html body #root` specificity hacks | 2,191 |
| `:root` blocks | 43 |
| `PASS` override patch blocks | 325 |
| Runtime recoloring modules | `src/utils/contrastGuard.ts`, `src/hooks/useAdaptiveHairline.ts` (both `MutationObserver`-based) |

Example winning rule that no component can override:

```text
html body #root [data-property-search-bar] [data-search-segment] {
  border: 1px solid rgba(255,255,255,0.42) !important;
}
```

## 2. Target architecture

```text
src/styles/
  tokens.css        <- single :root + .dark token source of truth
  base.css          <- reset, typography, focus-visible
  utilities.css     <- @layer utilities (small, token-only)
src/index.css       <- imports the three files above, nothing else
src/components/ui/* <- primitives styled ONLY with token utilities/CVA variants
```

Rules enforced from Phase 1 onward:
- Zero `!important` outside a tiny audited allowlist (print styles, third-party widget resets).
- Zero `html body #root` prefixes.
- Zero generic descendant repainting (e.g. `.card p`, `[class*="bg-emerald"] *`).
- No runtime DOM color mutation. Contrast is guaranteed by token pairs (surface + on-surface), not by inspecting rendered pixels.

## 3. Files to be rewritten

- `src/index.css` — reduced to `@tailwind` directives plus three imports.
- `src/styles/theme-tokens.css` — folded into the new `src/styles/tokens.css`.
- `src/components/ui/` primitives, in this order: `button.tsx`, `input.tsx`, `select.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `checkbox.tsx`, `tabs.tsx`, `dialog.tsx`, `card.tsx`, `badge.tsx`, `accordion.tsx`, `label.tsx`, `textarea.tsx`, `tooltip.tsx`, `switch.tsx`, `radio-group.tsx`.
- Brand wrappers that hardcode hex: `brand-button.tsx`, `brand-checkbox.tsx`, `hero-button.tsx`, `PremiumEmeraldCard.tsx`, `Surface.tsx`, `AdaptiveHairline.tsx`.
- `src/components/search/PropertySearchBar.tsx`, `PropertyFilterScreen.tsx`, `AreaIncludeExclude.tsx`, `ResultsToolbar.tsx`, `GeoFilterBar.tsx` — de-`data-*`-attribute-styled, moved to variants.
- `src/components/content-page/LegalParts.tsx`, `ContentPageShell.tsx`, `PremiumEmeraldHero.tsx`, `src/components/guides/GuideTableOfContents.tsx`.

## 4. Files to be deleted

- `src/utils/contrastGuard.ts` and its call site in `src/main.tsx`.
- `src/hooks/useAdaptiveHairline.ts` + `src/styles/hairlineTokens.ts` + `src/components/ui/AdaptiveHairline.tsx` (replaced by static token hairlines).
- `src/App.css` (dead legacy sheet).
- `src/styles/dev-before-overlay.css` if unreferenced after Phase 2.
- All 325 `PASS` patch blocks inside `index.css` (deleted, not commented out).
- Associated tests that assert runtime recoloring behaviour: `src/hooks/__tests__/useAdaptiveHairline.test.ts`, `src/components/ui/__tests__/AdaptiveHairline.test.tsx`.

## 5. Global rules to be removed

1. Every `html body #root …` block (2,191).
2. Every `!important` outside the allowlist (11,073 → target < 20).
3. All 43 duplicate `:root` blocks collapsed into one, plus one `.dark`.
4. All `[class*="…"]` partial-class selectors (2,142) — replaced by explicit variants.
5. All attribute-hook painters (`[data-property-search-bar] …`, `[data-search-segment]`, navigator/section-frame blocks).
6. All inline `style={{ color / background / border }}` colors in migrated components.

## 6. Token consolidation

One HSL token set in `src/styles/tokens.css`, each surface paired with its ink so contrast cannot drift:

```text
--surface-emerald / --on-surface-emerald
--surface-champagne / --on-surface-champagne
--surface-card / --on-surface-card
--hairline-on-dark / --hairline-on-light
--brand-emerald-1: 162 84% 16%   /* #064E3B */
--brand-emerald-2: 158 82% 9%    /* #042c1c */
--gradient-emerald-pair: linear-gradient(135deg, ...1, ...2, #000)
```

Emerald is only ever consumed through `--gradient-emerald-pair` (pair lock preserved). Tailwind config maps semantic names to these tokens; components use `bg-surface-emerald text-on-surface-emerald`, never raw hex.

## 7. Migration order (7 phases)

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 0 | Baseline: visual snapshots of 25 key routes, CSS metrics recorded, migration branch tag for rollback | Snapshots stored under `/tmp/refactor-baseline` |
| 1 | Create `tokens.css` / `base.css` / `utilities.css`; wire Tailwind config. Old CSS still loaded | Build green, zero visual diff |
| 2 | Delete runtime recoloring (contrastGuard, adaptive hairline) and replace with static token pairs | No `MutationObserver` styling in `src`; dark-surface contrast ≥ 4.5:1 measured |
| 3 | Migrate primitives (`components/ui`) to token variants | Each primitive renders identically in Storybook-style dev route + tests pass |
| 4 | Delete `html body #root` + `!important` + partial-class blocks in tranches of ~4,000 lines, fixing fallout per tranche | `index.css` < 3,000 lines, `!important` < 20 |
| 5 | Migrate search + content-page + policy components off attribute painters | Filter bar, dropdowns, policy pages verified desktop/tablet/mobile |
| 6 | Full-route sweep of remaining pages, inline-style removal | All 25 routes diffed against Phase 0 baseline, all regressions triaged |
| 7 | Guardrails: lint rules banning `!important`, `html body #root`, raw hex in `src/components`; CI contrast test | Guardrail suite fails on a deliberate violation |

## 8. Regression testing after every phase

- `bunx vitest run` (existing unit/component suites).
- `tsgo` typecheck.
- Playwright route sweep: 25 routes × 3 viewports (390 / 834 / 1440) screenshots diffed against the Phase 0 baseline.
- Computed-style assertions per phase: for each of `body`, card, dropdown item, focused input, emerald CTA, policy section — assert resolved `color` / `background` / `border-color` and compute WCAG contrast ≥ 4.5:1.
- CSS metric gate: `!important`, `html body #root`, `:root`, partial-class counts must be non-increasing.
- Console/runtime error check on every visited route (zero tolerance).

## 9. Rollback strategy

- Each phase is a single self-contained changeset; nothing is half-migrated across a phase boundary.
- Phases 1–3 keep the legacy sheet loaded, so any failure is reverted by restoring the previous `index.css` import line.
- From Phase 4 the deleted CSS tranches are archived to `/tmp/refactor-archive/tranche-N.css`, so a failed tranche is restored verbatim in one step.
- Failure trigger: any route with a visual diff that is not an intended improvement, any contrast ratio below 4.5:1, or any console error. On trigger, the phase is reverted and re-scoped into smaller tranches rather than patched forward.
- No phase is reported complete without the measured evidence in section 8.

## 10. Technical notes

- Tailwind v3 + Vite; token layer must be imported before `@tailwind utilities` so utilities win over base.
- The emerald pair lock and Cormorant Garamond heading standard stay in force as tokens, not as `!important` overrides.
- Expected outcome: ~37.4k → under 3k CSS lines, one theme source, primitives that theme correctly by construction, and new components inheriting correct colors by default.
