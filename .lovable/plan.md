I found the actual problem: there is not one remaining broken component. The page still has multiple competing contrast systems, and the currently “winning” rules are applying foreground colors by class instead of by the element’s real surface.

What is wrong now:
- `CompanyProfile.tsx` puts `text-white` inside champagne cards (`jj-card-inner`), so “Table of Contents” and “Company Snapshot” become white-on-champagne.
- The global `.jj-card-inner` class sets a champagne background but does not declare itself as a light surface, so dark-surface/hero rules can still win against its children.
- The final primitive lock only protects direct children of navy/dark surfaces (`>`), so nested icons/text inside navy buttons can still be repainted black.
- `.icon-tile:hover` globally repaints icon tiles to accent colors, which can override navy icon tiles on hover/focus.
- `PressKit.tsx` has hard-coded black icons/text inside black/dark tiles and overlays, causing black-on-dark failures.
- `phone-input.tsx` has a hover rule that turns text black on a dark phone-code trigger.
- Several section headings in light/champagne bands still use `text-white`; this is why the issue appears “across the website.”

Plan to fix it properly:

1. Fix the global surface contract, not one screenshot at a time
- Mark `.jj-layer-2`, `.jj-card-inner`, `.jj-box-active`, and `.jj-icon-box-active` as light/champagne surface owners in CSS.
- Add final light-surface locks so descendants using `.text-white`, `.text-white/70`, `.text-white/80`, etc. render ink on champagne cards/bands.
- Add final dark/navy locks that work for nested descendants, not only direct children, so navy buttons and icon tiles keep white text/icons.
- Exclude explicit dark/navy CTA primitives from light-surface locks.

2. Remove/neutralize the wrong winning hover rules
- Stop `.icon-tile:hover .lucide` from repainting navy/ink tiles to dark accent colors.
- Preserve white icons for `[data-icon-tile][data-surface="navy"]` and `[data-icon-tile][data-surface="ink"]` in idle, hover, active, and focus states.
- Fix `button[data-phone-code-trigger]` and `.jbj-form-trigger-filled` descendants so phone country selector text/icons stay white on navy, including hover.

3. Repair the page-level hard-coded conflicts shown in the screenshots
- `CompanyProfile.tsx`: convert section headings and card text inside champagne surfaces from `text-white` to ink/gold-safe classes; keep only true photo/dark hero text white.
- `PressKit.tsx`: replace black icons inside black boxes/overlays with white or `IconTile`; fix protected badges and overlay helper text so dark overlays use white, champagne cards use ink.
- `SupportTicketBox.tsx`: ensure the “Create Support Ticket” button uses the locked navy CTA surface and the headset icon remains white.
- `CareersFAQ.tsx` / join FAQ: ensure the open navy chevron circle uses the locked navy icon surface so the chevron stays white.
- `phone-input.tsx`: remove the hover-to-ink rule on dark phone inputs/triggers.

4. Add a targeted technical contrast audit script
- Add a small script that visits/inspects the affected routes and reports obvious conflicts:
  - white text on light/champagne/card backgrounds
  - black/ink icons/text on navy/dark backgrounds
  - transparent text on non-gradient backgrounds
- Use it only as validation; do not use it to auto-rewrite the site.

5. Visual validation before claiming completion
- Navigate as a user and capture screenshots on the reported pages/sections:
  - `/join` FAQ + form phone input
  - `/about` market intelligence/data cards
  - `/contact` form + support ticket section
  - `/press-kit` bio, headshots, fact sheet
  - `/company-profile` hero, table of contents, company snapshot, CTA sections
- For each failing pattern, inspect computed styles for representative elements: text color, icon color/stroke, own background, nearest surface owner.
- Only report fixed if screenshots and computed styles confirm the two rules: ink on champagne/light; white on navy/dark.