I inspected the homepage and confirmed the issue is real in the current preview: the six hero action cards are rendering as white cards with white/faded icons and labels, and the role-selector icons are still vulnerable to global contrast rules. I will fix the actual homepage components and then verify with screenshots.

Plan:

1. Restore the six hero action cards to glass styling, not solid white
- Update `src/pages/Index.tsx` where the `heroActions` cards are rendered.
- Keep the sixth card label as `Submit Complaint` and do not change it to any other wording.
- Replace the current solid white / cream hover behavior with a consistent glass style like the three premium pillar cards:
  - Normal: translucent dark glass (`rgba(26,26,26,0.55-0.70)`), white/champagne label, visible gold icon, thin white/gold border, backdrop blur.
  - Hover: slightly brighter premium glass, gold border, clear white/champagne title, visible gold/white icon.
- Explicitly opt these hero cards out of the global contrast guard so it cannot convert the glass cards into white-on-white again.
- Remove the forced light hover (`hover:bg-[#EFE6D6]`) that caused the cards to become white.

2. Fix the three “Tell us who you are” role cards at the source
- Update `src/components/home/CategorySelectorSection.tsx`.
- Replace the fragile hand-coded icon box with a hardened icon tile structure that uses explicit inline color/stroke variables and `data-no-contrast-guard` on the icon tile subtree.
- Make the icon states unambiguous:
  - Normal: cream tile + gold border/ring + solid ink icon.
  - Hover: ink tile + gold border/ring + solid champagne icon.
- Ensure the icon itself has full opacity and a strong stroke width, with inline `color` and `stroke` so global CSS cannot fade it.

3. Make `Continue` gold as requested
- In the three role cards, make `Continue` and its arrow use gold on normal load.
- On hover, keep it visibly gold/stronger gold, not faded ink.
- Keep the bottom divider and Continue rows aligned using the existing `mt-auto` layout.

4. Protect these exact fixes from global CSS overrides
- Add narrow component-level class names/data attributes only on these homepage cards.
- If needed, add a small scoped CSS override in `src/index.css` for those exact classes so later global rules cannot turn icons/text white-on-white or black-on-black.
- Avoid broad CSS changes that could break the rest of the site.

5. Screenshot proof after implementation
- Load the homepage at the user’s current viewport size: 1028×769.
- Capture a screenshot of the hero section showing all six glass cards readable on normal load.
- Hover the sixth hero card and capture/verify its hover state remains glass with visible icon/title.
- Scroll to “Tell us who you are” and capture a normal-state screenshot proving all three icons are visible and `Continue` is gold.
- Hover one role card and capture/verify its icon remains visible and the Continue row remains aligned/gold.

Acceptance criteria:
- No hero action card is solid white on normal load or hover.
- All six hero card icons and titles are readable on normal load and hover.
- The sixth hero card remains `Submit Complaint`.
- All three role-card icons are visible on normal load and hover.
- Role-card `Continue` text/arrow is gold and aligned across all three cards.
- Screenshots are provided after the fix, not just claimed.