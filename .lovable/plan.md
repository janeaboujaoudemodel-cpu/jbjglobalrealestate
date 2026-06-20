# Pass 17 — Champagne Shell + Card CTA Contrast

## 1. Sidebar / Horizontal header / Footer → champagne (match card)
Cards use page champagne `#FDFBF7` / surface `#F7F2EA`. The current pearl-white sidebar reads as a mismatched panel.

- `src/index.css` (Pass 16 `[data-sidebar-emerald]` block): swap the white→pearl gradient for the champagne token pair — base `#F7F2EA`, subtle vertical wash to `#FDFBF7`. Keep emerald hairline divider, emerald icon tiles, ink labels, and emerald-ombre active pill (unchanged).
- `HorizontalUtilityBar.tsx` + `GlobalFilterBar.tsx`: replace any white fill with the same champagne surface `#F7F2EA`; keep 1px faded gold hairline at the bottom only.
- `MinimalFooter.tsx`: same champagne surface, ink text, gold hairline top border. No pure white.

Result: sidebar + top bar + footer + card all share one champagne tone — the cards stop looking like cut-outs.

## 2. Card CTAs (Email / Call / Chat) — locked contrast
Currently render dark-emerald fill with low-contrast text both at rest and on hover.

- Locate the listing-card action row (likely `src/components/listings/ListingCardActions.tsx` or similar inside the card component used by Handpicked For You).
- Convert all three buttons to the locked `.jj-cta-dark` primitive (`data-cta="dark"`) with:
  - bg `#064E3B` (emerald ink), hover `#0a6b53`
  - text + icon `#FFFFFF` at all states (`data-no-contrast-guard` + `allow-white` to bypass the white-on-light guard since the button's own bg is verifiably dark emerald)
  - 1px inner highlight `rgba(255,255,255,0.08)`
  - focus ring 2px `#B89555`/40
- Verify with `browser--screenshot` at idle and hover for one card; check the contrast guard does not flip icons to ink.

## 3. Validation
- Screenshot Handpicked For You section: sidebar/header/footer/card all share champagne; CTAs show crisp white text+icons on emerald at rest AND hover.
- Confirm no regression on emerald-ombre active sidebar pill or AI Home Finder idle row.

## Files
- `src/index.css` (Pass 17 champagne shell override + CTA lock)
- `src/components/navigation/HorizontalUtilityBar.tsx`
- `src/components/navigation/GlobalFilterBar.tsx`
- `src/components/home/MinimalFooter.tsx`
- Listing card actions component (path confirmed during build)
