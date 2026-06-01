I will fix the exact issues shown in your screenshots, not just describe them.

Plan:

1. Fix homepage portal contrast at the source
- Update `src/index.css` so dark/navy surface rules no longer force white `-webkit-text-fill-color` onto nested champagne/light panels.
- Add a targeted override for nested `data-surface="champagne"`, `data-surface="light"`, `surface-champagne`, and `surface-light` inside navy portal shells so their text/icons render ink/gold correctly.
- Keep white text only on the actual navy panels and navy CTA buttons.

2. Lock `PortalShowcaseCard` surface boundaries
- Update `src/components/home/PortalShowcaseCard.tsx` so the champagne side, light metric card, and private OS panel explicitly opt into light-surface foreground behavior.
- Remove the conditions that let the parent navy `allow-white` styling leak into those child cards.
- Keep the right navy command-center panel dark and premium.

3. Fix the horizontal header and vertical sidebar color treatment
- Update `HorizontalUtilityBar.tsx` and `GlobalVerticalNav.tsx` to use the same champagne/gold premium shimmer treatment as the partners marquee.
- Keep the palette champagne-dominant with gold hairline accents only; no gray or bright yellow-gold fills.

4. Remove duplicate divider lines under the collapsed monogram/header
- Remove the extra pseudo-element divider under the collapsed JBJ monogram.
- Keep only one clean boundary between the horizontal header and content.
- Remove any second line that appears because both the collapsed sidebar header and horizontal header are drawing bottom borders at the same height.

5. Verify after implementation
- Visually check the homepage at the portal sections shown in your screenshots.
- Confirm the champagne/light cards are readable, the navy panel still has white text, the header/sidebar look premium champagne-gold, and there is no duplicated divider under the monogram/header.