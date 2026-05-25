# Navy Blue Accent Restyle + Broker Portal Fix

Apply the same premium navy blue (`#102540` bg / `#1a3d63` inner) used on the "Get Verified / Join Benzini Community" banner as a site-wide accent. Keep champagne as the dominant palette; navy is only used to add contrast on selected sections and CTAs.

## Token

Add `--accent-navy: #102540` and `--accent-navy-soft: #1a3d63` to `src/index.css` so every restyled surface pulls from one source. Foreground on navy = white; secondary text = `white/75`; hairline = `white/15`; CTA on navy = champagne mother-of-pearl with ink text (matches existing button standard, no solid black/white).

## Sections to restyle to navy

Homepage:
- Footer (main band) — navy background, white text, gold hairline dividers, champagne CTA buttons
- Contact Us section — navy band as the page-level accent block
- "Join Benzini / Get Verified" banner — already navy, used as reference

Across site:
- Broker Portal hero/header band only (see fix below)
- Any standalone "Join us / Become a member / Apply" CTA bands

## Sections explicitly NOT touched

- Partners with Dubai Police (homepage)
- Help / Support section
- Any page or card surfacing Properties, Projects, Areas, Developers (listings, detail pages, filters, maps)
- "Explore Our Properties" section + tutorial/tool tabs
- Mortgage Calculator
- "Top Areas in Dubai" block
- Global header (top bar)
- Vertical sidebar
- Mode pills, price pills, developer logos, listing cards

## Contrast rules on navy surfaces

- Body text → `text-white`
- Secondary text → `text-white/75` (never faded gold, never gray)
- Icons → white via existing `<IconTile />` with `tone="ink"` inverted variant; no black SVG on navy
- Hairlines → `white/15` (no gray dividers, per No-Gray rule)
- Buttons → champagne mother-of-pearl + 1px gold hairline + ink text (existing `Button` default); mark dark-section opt-out with `data-on-dark` where needed
- Links → white with gold underline on hover

## Broker Portal fix

Current state: three stacked borders around the portal frame, and the main outer border is narrower than the content width.

Fix:
1. Remove the middle border entirely (single inner divider, not a framed box)
2. Keep one outer border only, extend it to full content width (match the page container's max width, not the inner card)
3. Re-skin the outer band to navy with white text per rules above
4. Verify on the current 975px viewport and at sm/md/lg breakpoints

## Files (expected)

- `src/index.css` — add navy tokens, ensure contrast guards allow white text on navy via `data-on-dark`
- `src/components/layout/Footer*.tsx` — repaint to navy band
- `src/components/home/ContactUs*.tsx` (or equivalent contact section) — repaint to navy band
- `src/pages/BrokerPortal*.tsx` / `src/components/broker-portal/*` — remove middle border, widen outer border, repaint header to navy
- Any shared "JoinCommunity" / "GetVerified" CTA component — already navy, leave as canonical reference

## Out of scope

No business logic, no route changes, no new components beyond a small `<NavyBand>` wrapper if reuse warrants it. Pure presentational restyle.

## QA

- 975px (current), 1280px desktop, 768px tablet, 390px phone
- Verify excluded sections are visually unchanged
- Verify no white-on-light or black-on-navy contrast regressions
- Verify Broker Portal shows exactly one outer border at full content width, zero middle border
