# Scope the global emerald/background guards sitewide

## Current state (verified in `src/index.css`)

- The PASS 220 emerald accordion block (line ~35896) is already **opt-in** via a `[data-faq-emerald]` ancestor, and the blanket `[data-radix-accordion-trigger] *` white-text + emerald `:hover` overrides are gone.
- The field-background blanker (line ~18800) is already narrowed to `input[type="search"]`, `[data-search] input`, `.jj-search input`, `.search-input` — the loose `[class*="search" i]` matcher is gone.

So the two blocks named in the request are done. What remains is the sitewide sweep and visual validation.

## Remaining work

1. **Audit for sibling guard blocks** that still force text color or blank backgrounds sitewide with `!important`:
   - `:where(input, textarea)` placeholder/color locks
   - any `html body ... *` descendant color locks that could beat component hover colors on accordions, list rows, and cards
   - Scope each hit the same way: opt-in attribute or explicit selector list, plus a `[data-no-contrast-guard]` escape hatch. No new tokens, no component edits.

2. **Sitewide visual validation with Playwright** across representative routes (home, an FAQ page, contact/forms, a project detail page, and one backend/CRM form page):
   - screenshot each page
   - capture computed `background`/`color` on form fields and accordion triggers in default and hover states
   - report any page where a guard still overrides component styling

## Scope guard

Only `src/index.css` changes. No component files, no color tokens, no layout rules.

## Note

`/faq` and `/contact` sit behind the access gate in preview; validation will use the injected session so those routes render.
