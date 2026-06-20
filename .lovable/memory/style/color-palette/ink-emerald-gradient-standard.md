---
name: Ink-Emerald Gradient Standard
description: Global brand ink — replaces flat black on dark CTAs, dark cards, dark hero bands, dropdowns, and any opt-in [data-ink-emerald]/[data-hero-dark] surface. Deep forest emerald → near-black diagonal gradient with mint accent and gold hairline preserved.
type: design
---

# Ink-Emerald Gradient — Brand Standard (PASS 9)

The new dominant "ink" for all DARK surfaces site-wide. Replaces flat
`#0A0A0A` / `#1A1A1A` / `#1F1F1F` / `#000` on CTAs, cards, hero bands,
dropdowns, and any opt-in `[data-ink-emerald]` / `[data-hero-dark]`
wrapper.

## Recipe (single source of truth — defined in `src/index.css` `:root`)

```css
--ink-emerald-1: #064E3B;
--ink-emerald-2: #042c1c;
--ink-emerald-3: #000000;
--ink-emerald-ring: rgba(16, 185, 129, 0.32);
--ink-emerald-accent: #6EE7B7;
--gradient-ink:       linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%);
--gradient-ink-hover: linear-gradient(135deg, #0a6b53 0%, #064E3B 55%, #042c1c 100%);
```

JS mirror in `src/lib/brand-tokens.ts` → `BRAND.inkEmerald`.

## Where it applies (automatic)

CSS PASS 9 block at the END of `src/index.css` repaints any of these
without per-file edits:

- `.jj-cta-dark`, `.jj-navy-cta`, `[data-cta="dark"]`
- `[data-surface="dark"|"ink"|"navy"]`, `.surface-dark`, `.surface-ink`, `.surface-navy`
- Any element with `[data-ink-emerald]` or `[data-hero-dark]`
- Tailwind classes `bg-[#0A0A0A]`, `bg-[#1A1A1A]`, `bg-[#1F1F1F]`, `bg-black`

Gold hairline `#B89555` is preserved as the border on the same primitives.
Hover swaps to `--gradient-ink-hover`.

## Where it does NOT apply (opt-out)

- Body text ink stays `#1A1A1A` — text color is unchanged.
- Champagne page/surface/raised — unchanged.
- 88px header + sidebar L-frame (`header`, `aside`, `[data-app-chrome]`) — skipped by the guard.
- Footer obsidian band (`footer`) — skipped by the guard.
- Explicit per-element escape hatch: `[data-ink-emerald-opt-out]`.

## Contrast guard exception

Inside `[data-ink-emerald]` or `[data-hero-dark]`, the white-on-light
PASS 6/7 guard is overridden — white text/icons stay white because the
gradient is dark enough for AA contrast. This is what fixes hero titles
like "Property Measurement" that were being flipped to ink by the
dominant guard.

## Accent helpers

```html
<Icon className="ink-emerald-accent" />      <!-- color: #6EE7B7 -->
<div className="border ink-emerald-ring" />  <!-- border-color: rgba(16,185,129,0.32) -->
```

## Never re-introduce

- Flat solid black fills on dark CTAs — the global guard now ensures the gradient wins.
- Replacing the gold `#B89555` hairline with mint — gold stays.
- Painting body text emerald — body text ink stays `#1A1A1A`.
