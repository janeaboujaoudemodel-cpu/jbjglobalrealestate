## What I found

Two `!important` guard blocks in `src/index.css` are the ones overriding FAQ hover text and form-field backgrounds:

**1. "PASS 220 — Sitewide Emerald FAQ Accordion Standard"** (lines ~35895–35958)
Applies to *every* Radix accordion sitewide (front end and backend), forcing:
- emerald gradient panel on `[data-radix-accordion-item]`
- `color: #FFFFFF !important` + `-webkit-text-fill-color` on the trigger **and every descendant** (`[data-radix-accordion-trigger] *`), which is what defeats any component hover text color
- an emerald hover background on the trigger
Only opt-out today is the class `.no-faq-emerald`.

**2. Global search/field background blanker** (lines ~18800–18804)
```css
:where([type="search"], [data-search], .jj-search, .search-input, [class*="search" i]... input...) {
  border-color: ... !important;
  background: transparent !important;
  background-image: none !important;
}
```
The `[class*="search" i]` matcher is case-insensitive and unanchored, so it blanks the background of any field whose class merely contains "search", plus every `[type="search"]` input anywhere.

## Changes

**A. Invert PASS 220 from sitewide-forced to opt-in**
- Change the block's selector base from
  `[data-radix-accordion-item]:not(.no-faq-emerald *):not(.no-faq-emerald)`
  to an opt-in scope: `[data-faq-emerald] [data-radix-accordion-item]` (with `.no-faq-emerald` opt-out preserved).
- Remove the `[data-radix-accordion-trigger] *` blanket white-text rule and the `:hover` background override from the global path, so each FAQ component's own hover/text classes win again.
- Keep the layout-only accordion rules at ~19305 (flex/alignment) untouched.

**B. Narrow the field-background blanker**
- Replace the loose selector with an explicit, intentional list: `input[type="search"]`, `[data-search]`, `.jj-search`, `.search-input`, and the existing hero/newsletter pill inputs (which already have their own dedicated transparent rules below).
- Drop `[class*="search" i]` entirely so component-defined form-field backgrounds (`bg-*`, inline styles, shadcn Input defaults) render as coded.

## Scope guard

- Only these two blocks in `src/index.css` change. No component files, no other guard blocks, no color tokens, no layout rules.

## Verification

- Playwright pass over a front-end FAQ page and a backend form page: screenshot FAQ hover state and a form field to confirm component styling shows and no other section shifted.
