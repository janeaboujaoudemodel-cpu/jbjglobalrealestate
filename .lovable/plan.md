## Goal
Guarantee that on every page, every card, every button and every text block remains readable, no matter which background it lands on — without authors having to remember per-component contrast rules.

The site already has many partial guards (`scripts/contrast/*`, `src/utils/contrastGuard.ts`, the PASS guards in `src/index.css`). They cover specific failure modes. This plan unifies them behind a single, predictable **surface theme system**.

## Architecture: 4 named surfaces

Every container declares one of four surfaces. Descendants inherit safe colors automatically.

```text
surface-page       FDFBF7  ink #1A1A1A   (default — everywhere)
surface-champagne  F7F2EA  ink #1A1A1A   (cards on page)
surface-gold       B89555  white #FFFFFF (gold CTAs / accent tiles)
surface-ink        1A1A1A  champagne #F7F2EA (dark hero / footer / dark cards)
```

Each surface rebinds the same set of CSS variables: `--surface-bg`, `--surface-fg`, `--surface-fg-muted`, `--surface-border`, `--surface-icon`, `--surface-link`, `--surface-cta-bg`, `--surface-cta-fg`. So `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground` all "just work" on any surface.

## Changes

### 1. `src/index.css` — new global layer (added near existing `.surface-light` / `.surface-dark` block)

- Add `[data-surface="page"|"champagne"|"gold"|"ink"]` selectors that rebind the token set above (HSL, in `@layer base`).
- Add aliases so existing `.surface-light` and `.surface-dark` keep working (no breaking change).
- Strengthen the global text floors so any descendant of a `data-surface` ancestor that uses `text-white` / `text-black` / `text-gray-*` is auto-corrected to the surface's foreground color (extends the existing PASS rules for all four surfaces, not just light/dark).
- Add a new utility selector group: cards built with `bg-card`, `bg-white`, `bg-[#FDFBF7]`, `bg-[#F7F2EA]`, `bg-black`, `bg-[#1A1A1A]`, gold backgrounds → automatically inherit the matching `data-surface` so descendant text/icons/borders are corrected even when the author forgot to add the attribute.
- Border floor: any `border-*/0…20` on a text-bearing card is lifted to `--surface-border`, so faint hairlines never disappear against same-tone backgrounds.

### 2. `src/utils/contrastGuard.ts` — broaden runtime coverage

Currently scans only `button, a, [role=button]…`. Expand to also scan text-bearing nodes that commonly fail:
- `h1-h6, p, li, span.font-*, [data-card], .card`
- For each, compute fg/bg luminance the same way; if the WCAG AA ratio for normal text (4.5:1) fails, force `--surface-fg` (or its inverse) via the existing `jbj-contrast-fix` class.
- Keep the `[data-no-contrast-guard]` opt-out and the existing 250 ms / 1 s / mutation-observer schedule.
- Add a small throttle (max 4 scans/sec) to keep the cost flat on large pages.

### 3. New small primitive: `src/components/ui/Surface.tsx`

```tsx
<Surface tone="champagne" as="section">…</Surface>
```

Thin wrapper that renders `<section data-surface={tone} className="bg-[var(--surface-bg)] text-[var(--surface-fg)] border-[var(--surface-border)]">`. Optional, non-breaking — existing components keep working through the auto-mapping in step 1.

### 4. CI: extend the existing contrast scripts

- `scripts/contrast/check-tokens.mjs` — add the 4 new surface pairs to the matrix it already validates (4.5:1 normal text, 3:1 UI).
- `scripts/contrast/check-rendered.mjs` — add 5 routes to the rendered Playwright sweep: `/`, `/properties`, `/jbj-broker-dashboard`, `/owner-dashboard`, `/contact`.
- `scripts/contrast/allowlist.json` — no new entries; existing decorative selectors remain.

### 5. Memory

Save a `mem://ui-ux/visual-standards/global-surface-theme-standard` rule with:
- The 4-tone model and which token each surface rebinds.
- The "set `data-surface` on any new container; never hardcode `text-white`/`text-black` directly" instruction.
- Pointer to `Surface.tsx` and the auto-mapping fallback.

## Files touched

- `src/index.css` — add the surface-tone block and auto-mapping rules (~80 lines, additive)
- `src/utils/contrastGuard.ts` — broaden selector + add throttle (~20 lines changed)
- `src/components/ui/Surface.tsx` — new (~30 lines)
- `scripts/contrast/check-tokens.mjs` — add 4 token pairs
- `scripts/contrast/check-rendered.mjs` — add 5 routes
- `mem://ui-ux/visual-standards/global-surface-theme-standard.md` — new memory

No DB changes. No new dependencies. No removals. Fully backward-compatible: pages that don't opt in still get the existing PASS guards plus the broader runtime coverage.