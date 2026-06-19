---
name: Global Dropdown + Metallic CTA Lock
description: Dropdown surfaces match the form (#FDFBF7 + gold hairline + premium row sizing). Metallic CTA uses the EXACT sqft pill animation (jj-metal-sheen). Phone country trigger is STATIC champagne (no animation).
type: constraint
---

# Locked rules — `src/index.css`

## Metallic CTA (`.jj-cta-gold-metallic`)
- Palette + size + animation MUST be byte-identical to `.jj-metallic-active` (sqft pill in `HorizontalUtilityBar.tsx`).
- Keyframe: `jj-metal-sheen` ping-pong (`0%→100%→0%` background-position), `4.5s ease-in-out infinite`.
- Used ONLY for primary CTAs (Request Callback, Request Consultation, Register Interest, Submit Report, Download/Request Brochure).
- Text + icons locked to `#3a2a08` for ink-on-gold contrast.

## Phone country trigger (`button[data-phone-code-trigger]`)
- STATIC. No metallic, no animation, no shimmer.
- Surface = `#FDFBF7` (form cream); border `1px solid rgba(184,149,85,0.55)`; hover `#F7F2EA`.
- Removed from dark-CTA contrast list — text/icons stay ink `#1A1A1A`.

## Floating surfaces (Radix popper)
- All `[data-radix-popper-content-wrapper] > [data-radix-{select,popover,dropdown-menu,combobox}-content]`, listbox/menu/dialog and `.jbj-form-popover` MUST render:
  - `background-color: #FDFBF7` (no gradient — flat to match form fields)
  - `border: 1px solid rgba(184,149,85,0.55)`
  - `padding: 6px` (shell) + per-row `min-height: 40px`, `padding: 8px 12px`, `font-size: 14px`, `gap: 10px`, `border-radius: 8px`
  - Flag/leading emoji rendered via `.text-lg` is forced to `font-size: 18px` for premium readability.
  - Hover/highlight tint: `rgba(184,149,85,0.14)`.
- Dark popovers opt-in via `[data-on-dark]`.

## Default phone variant
- `<PhoneInput />` default `variant` is `'light'`. Dark variant must never be the implicit default.

## Owner mode
- `usePreviewAsVisitor()` defaults to `true` so owners land in User View on first paint.

## Global form dropdown gold lock (added 2026-06-19)
- Every Select / Combobox / Popover trigger inside a `<form>` or `[data-jbj-form]` is auto-painted with the metallic champagne-gold gradient identical to `[data-phone-code-trigger]` (linear-gradient #d8b86a → #f4e3a8 → #b89555 → #f4e3a8 → #d8b86a, 1px rgba(184,149,85,.85) border, ink #3a2a08 text/icons).
- Active / selected / highlighted option inside any `[data-radix-popper-content-wrapper]` (select-item[data-state=checked], cmdk-item[data-selected=true], role=option[aria-selected=true|data-highlighted]) gets a faded gold-gradient fill so the chosen row glows (matches "United Arab Emirates" reference screenshot).
- Opt-outs: `[data-no-gold-trigger]`, `[data-cta]`, `[data-allow-dark-cta]`, `[data-on-dark]`, `.jj-cta-*`. Filter/sort dropdowns outside forms keep their existing styling.
- Rule lives in `src/index.css` under "GLOBAL FORM DROPDOWN GOLD LOCK".
