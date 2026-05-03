I verified the live homepage section and the issue is real: the icon tiles are rendering as nearly blank white boxes, the tagline text is pushed too far right and wraps awkwardly, and the bottom dividers/Continue rows are not aligned because the cards are not using a consistent internal flex layout.

Plan:

1. Fix the actual homepage component
- Update `src/components/home/CategorySelectorSection.tsx`, which renders the three cards: “I'm an Investor”, “I'm a Broker”, “I'm a Developer”.
- Import and use the project-standard `<IconTile />` instead of the current hand-coded icon box, so normal-state contrast is guaranteed: cream tile, gold ring, ink icon.
- Add a proper hover state on the tile: ink background + champagne/white icon, with a visible gold ring.

2. Rebuild the card layout so everything aligns
- Make every card `h-full flex flex-col`.
- Make the card grid use `items-stretch` so all three cards have equal height in the row.
- Change the top row from `justify-between` to a compact left-aligned header: icon tile + tagline immediately beside it.
- Give the tagline a constrained, readable treatment (`leading-tight`, smaller tracking, `max-w`, no excessive gap) so “Buy, hold, and grow”, “Sell smarter, faster”, and “Launch with confidence” sit visually next to the icon instead of floating far away.

3. Align dividers and Continue rows
- Put the description + bullet list into a flex-growing middle content block.
- Move the bottom divider/Continue row into `mt-auto`, so all dividers and Continue links line up at the same baseline across all cards.
- Keep the bottom arrow visible and high contrast, without relying on low-contrast gold text.

4. Prove it with screenshots
- After the implementation is approved and applied, I will load the homepage at the same desktop viewport.
- I will scroll to “Tell us who you are”.
- I will take a normal-state screenshot showing the fixed icon contrast, tagline spacing, and aligned Continue rows.
- I will also hover one of the cards and take a hover-state screenshot to prove the hover contrast is fixed too.