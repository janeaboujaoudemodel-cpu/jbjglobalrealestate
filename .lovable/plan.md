## Goal

Make the navy `#102540` and gold `#B89555` palette (plus their hover/soft/ring variants) a single source of truth so forms, buttons, footers, and checkboxes everywhere stay in lockstep — change one token, the whole app updates.

Today these hexes are inlined ~10k times across ~1.1k files. We won't rewrite all 10k call sites in one pass — that's churn-prone. Instead we lock the tokens, expose them through Tailwind, ship shared primitives for the four element classes the user named, and migrate the high-traffic surfaces.

## What's already in place

`src/styles/theme-tokens.css` already defines `--t-form-blue`, `--t-form-blue-soft/muted/ring/tint`, `--t-gold`, `--t-gold-soft/faint/ring`, plus careers navy/cream. `src/index.css` defines HSL `--gold*` and champagne tokens. Tailwind exposes `gold.*` only. Most components still hard-code `#102540` / `#B89555` / `#1a3d63` / `#143052` in `className` strings.

## Plan

### 1. Canonical token layer (no new colors)

In `src/styles/theme-tokens.css`, consolidate the brand pair under one block and add the missing hover/active aliases the codebase already inlines:

```
--brand-blue:        #102540;   /* alias of --t-form-blue */
--brand-blue-hover:  #1a3d63;
--brand-blue-deep:   #143052;
--brand-blue-soft:   rgba(16,37,64,0.22);
--brand-blue-ring:   rgba(16,37,64,0.18);
--brand-blue-tint:   rgba(16,37,64,0.06);
--brand-gold:        #B89555;   /* alias of --t-gold */
--brand-gold-hover:  #C9A66B;
--brand-gold-soft:   rgba(184,149,85,0.40);
--brand-gold-faint:  rgba(184,149,85,0.25);
--brand-gold-ring:   rgba(184,149,85,0.55);
```

Old `--t-*` and `--gold` HSL tokens stay as aliases pointing at the same value, so existing CSS keeps working.

### 2. Tailwind exposure

In `tailwind.config.ts`, extend `colors` with a `brand` namespace driven by the CSS vars:

```
brand: {
  blue:        'var(--brand-blue)',
  'blue-hover':'var(--brand-blue-hover)',
  'blue-deep': 'var(--brand-blue-deep)',
  gold:        'var(--brand-gold)',
  'gold-hover':'var(--brand-gold-hover)',
  'gold-soft': 'var(--brand-gold-soft)',
  'gold-ring': 'var(--brand-gold-ring)',
}
```

That unlocks `bg-brand-blue`, `text-brand-gold`, `border-brand-gold`, `ring-brand-gold-ring`, etc., so new code never needs a raw hex again.

### 3. Shared primitives for the four element classes

- `src/components/ui/brand-button.tsx` — three variants (`navy`, `gold-outline`, `navy-on-gold`) wrapping shadcn `Button` with `bg-brand-blue hover:bg-brand-blue-hover` + 1px `border-brand-gold` per memory rules.
- `src/components/ui/brand-checkbox.tsx` — wraps shadcn `Checkbox`, applies the gold-tick treatment via class instead of relying on the global CSS override (override stays as a safety net).
- `src/components/forms/JBJFormField.tsx` (lightweight) — re-exports the existing `.jbj-blue-field` / `.jbj-gold-field` classes through `cn` helpers `identityFieldClass()` / `preferenceFieldClass()` so forms stop string-concatenating hexes.
- `src/components/layout/FooterBrandTokens.tsx` (or just refactor `src/components/Footer.tsx` in place) — swap hex literals for `text-brand-gold`, `border-brand-gold/40`, `bg-brand-blue`.

No element types change; this is pure styling + token swap.

### 4. Targeted migration (not a global sweep)

Migrate only the canonical surfaces in this pass so the user sees the consistency goal land without a 1k-file diff:

1. `src/components/Footer.tsx` — all blue/gold hexes → `brand-*` classes.
2. `src/components/ui/button.tsx` variants that mention `#102540`/`#B89555` → token classes.
3. Form-adjacent files already in scope from last turn: `InquiryFormModal.tsx`, `ChatLeadForm.tsx`, `ConciergeGate.tsx`, `PreJoinForm.tsx`, `JoinApplication.tsx`, `CareersIntake.tsx` — swap stray hexes to `brand-*` / shared field classes.
4. `src/components/forms/JBJContactBlock.tsx`, `RequiredMark.tsx`, `FieldError.tsx` — switch to tokens.
5. Global checkbox override in `theme-tokens.css` switches its hardcoded `#B89555` to `var(--brand-gold)`.

Everything else continues to render correctly because the raw hexes still equal the token values; future edits can migrate file-by-file with confidence.

### 5. Guardrail

Add `scripts/lint/check-brand-hex.mjs` (advisory, not CI-blocking): greps `src/**` for `#102540|#B89555|#1a3d63|#143052` and prints offenders with the suggested `brand-*` replacement. Lets future work chip away at the remaining ~10k inlined hexes without another planning round.

## Out of scope

- Rewriting all ~1.1k files that still inline the hexes (would be done incrementally via the lint script).
- Introducing new colors, gradients, or changing any visual value.
- Touching the champagne/ink palette, the contrast guard, or any AI-purple / price-orange tokens.
- Backend, validation, or copy changes.

## Files touched

- `src/styles/theme-tokens.css` (add `--brand-*` aliases, swap one `#B89555` literal in the checkbox override)
- `tailwind.config.ts` (extend `colors.brand`)
- `src/components/ui/brand-button.tsx` (new)
- `src/components/ui/brand-checkbox.tsx` (new)
- `src/components/forms/JBJFormField.tsx` (new helper module)
- `src/components/Footer.tsx`
- `src/components/ui/button.tsx`
- `src/components/InquiryFormModal.tsx`, `src/components/chat/ChatLeadForm.tsx`, `src/components/concierge/ConciergeGate.tsx`, `src/components/video-meet/PreJoinForm.tsx`, `src/pages/JoinApplication.tsx`, `src/pages/CareersIntake.tsx`
- `src/components/forms/JBJContactBlock.tsx`, `src/components/forms/RequiredMark.tsx`, `src/components/forms/FieldError.tsx`
- `scripts/lint/check-brand-hex.mjs` (new)
