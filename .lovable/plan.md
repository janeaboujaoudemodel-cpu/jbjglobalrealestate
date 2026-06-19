# Fix /properties section layout + Global gold dropdown styling

## Problem
1. On `/properties`, the "Confused About Where to Buy or Invest in Dubai?" section renders broken: the consultation form is very tall (right column) while the left content (headline + 3 bullets) is short, and `items-center` on the 2-col grid leaves the headline floating awkwardly low/empty space everywhere.
2. The Phone country picker (`[data-phone-code-trigger]`) has a beautiful metallic champagne-gold gradient pill + champagne popover surface. All OTHER form dropdowns (Service Needed, Timeline, Nationality, Bedrooms select, etc.) still look like plain transparent fields with a hairline. User wants the SAME metallic gold trigger + champagne dropdown applied to EVERY form dropdown across the entire site.

## Step 1 — Fix the /properties section layout
File: `src/pages/Properties.tsx` (lines 1439–1487)

- Replace the dark `jj-layer-2` box with a full-bleed `jj-band jj-band--surface` (champagne band, edge-to-edge — matches the locked memory rule and the project-detail Register Interest treatment).
- Stack vertically instead of side-by-side:
  - Top: centered heading block (`max-w-3xl mx-auto text-center`) — eyebrow chip, H2, paragraph, 3-bullet list rendered as a centered 3-column responsive row.
  - Below: consultation form centered in `max-w-2xl mx-auto` so it doesn't get crushed and never leaves an empty column.
- Remove the cream-on-cream bullet dots (`bg-[#EFE6D6]`) which are invisible — switch to a 1px gold hairline check or `bg-[#B89555]`.
- Keep `py-16 sm:py-20` rhythm; outer `<section>` becomes `<section className="jj-band jj-band--surface py-16 sm:py-20">`.

## Step 2 — Apply gold metallic style to ALL form dropdown triggers globally
File: `src/index.css` (new block right after the existing `button[data-phone-code-trigger]` lock at ~line 4646)

Add a single global rule that paints every Radix Select/Combobox/Popover trigger inside a form with the exact same metallic gradient + champagne dropdown surface as the phone trigger. Scope it tightly so it does NOT touch:
- Primary CTAs (already animated metallic — opt-out `[data-cta]`, `.jj-cta-dark`, `.jj-cta-champagne`)
- Dark/owner surfaces (`[data-allow-dark-cta]`, `[data-on-dark]`, `.dark`)
- Sort dropdowns, filter dropdowns outside forms (`[data-no-gold-trigger]` opt-out)

Selectors to paint with the same gradient as phone trigger:
```
form [role="combobox"]:not([data-no-gold-trigger]):not([data-cta]),
form button[data-radix-select-trigger]:not([data-no-gold-trigger]),
form [data-radix-popover-trigger]:not([data-no-gold-trigger]):not([data-cta]),
[data-jbj-form] [role="combobox"]:not([data-no-gold-trigger])
```
Apply the same `background-image` gradient (`#d8b86a → #f4e3a8 → #b89555 → #f4e3a8 → #d8b86a`), 1px `rgba(184,149,85,.85)` border, ink `#3a2a08` text/icons, inset highlight + soft drop shadow, hover shifts `background-position: 100% 50%`. Identical to phone trigger.

Dropdown popover content (already champagne via the existing global popper rule). Add an active/selected item highlight using the gold gradient at 30% opacity so the chosen item glows like the "United Arab Emirates" row in the user's reference screenshot:
```
[data-radix-popper-content-wrapper] [data-radix-select-item][data-state="checked"],
[data-radix-popper-content-wrapper] [cmdk-item][data-selected="true"],
[data-radix-popper-content-wrapper] [role="option"][aria-selected="true"] {
  background-image: linear-gradient(135deg, rgba(216,184,106,.35), rgba(244,227,168,.45), rgba(184,149,85,.35));
  color: #3a2a08;
}
```

## Step 3 — Lock the rule in memory
Update `.lovable/memory/ui-ux/visual-standards/global-dropdown-and-cta-lock.md`:
- Add: "All form dropdown triggers (SelectTrigger, Combobox, Popover trigger inside `<form>` / `[data-jbj-form]`) render with the metallic champagne-gold gradient identical to `[data-phone-code-trigger]`. Active option in the dropdown gets a faded gold-gradient highlight. Opt-outs: `[data-no-gold-trigger]`, `[data-cta]`, dark surfaces."

## Validation (visual only, per user instruction)
1. `browser--view_preview /properties` at 992×853 → confirm the "Confused About…" section is single-column, centered, no awkward empty space, full-bleed champagne band.
2. Scroll to the consultation form, open the **Service Needed**, **Timeline**, **Nationality** dropdowns one by one → confirm each trigger is metallic gold (matches phone trigger) and each popover is champagne with a gold-highlighted active option.
3. Open one project detail page and repeat the dropdown check on the Register Interest form to confirm the rule is truly global.
4. Take a final screenshot of each step.

## Non-goals
- No backend, no component refactors beyond the one Properties.tsx section.
- Not touching primary CTAs, filter bar dropdowns outside forms, or any owner/dark surfaces.
- No removals of existing fields or copy.
