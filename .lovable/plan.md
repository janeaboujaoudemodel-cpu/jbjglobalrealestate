## Plan

### 1. Marquee title — stop the shimmer, use solid dark gold

In `src/components/DeveloperPartnersMarquee.tsx`:
- Remove the `.jbj-shimmer-text` animation from the title "Partners with Dubai's leading developers".
- Render the title in solid dark gold `#B89555` (no gradient, no animation).
- Keep the shimmering champagne **background band** behind the title and the gold hairline divider below it — only the text stops animating.

### 2. Make every homepage section match the width of Explore Our Services

Root cause: `Explore Our Services` is wrapped in `<PremiumSectionCard padding="none">`, so its inner card spans the full wrapper width. Other sections on `Index.tsx` use `padding="md"` (`p-5 md:p-8`), which insets the inner card and makes it visually narrower.

Fix on `src/pages/Index.tsx` — change all 7 occurrences of `padding="md"` to `padding="none"` on these wrappers so every section's inner card spans the same edge-to-edge width as Explore Our Services:

- Verification Banner
- Developer Portal CTA
- Featured Listings
- Continue Searching
- Resale Properties
- Overseas Investors
- (any remaining `padding="md"`)

For sections whose inner component relied on the wrapper's horizontal padding, add equivalent horizontal padding (`px-5 md:px-8`) inside the component itself so the **content** still breathes, but the **card frame** reaches the same width as Explore Our Services.

### 3. Verify globally

`PremiumSectionCard` is only used in `Index.tsx` (the toolkit hub doesn't use it). So once Index sections are aligned, all marketing sections that share this wrapper will be at the same Explore-Our-Services width. No other pages need editing.

### Out of scope
- I will not touch the marquee logo strip itself (locked component) — only the title row above it.
- I will not change the visual style of any individual section card (gold border, shadows, etc.) — only the outer wrapper width/padding.

### Clarifying point
Other pages (e.g. property pages, toolkit pages) do **not** use `PremiumSectionCard`, so this width rule only applies to the homepage marketing stack. If you want the same width rule enforced on other specific pages, tell me which ones and I will extend the fix.
