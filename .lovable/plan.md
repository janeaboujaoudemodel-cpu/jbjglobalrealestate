

## Royal Tools Hub Card Styling Fix

### Current State (from screenshots)
The category section cards (e.g. "Investment & Property Tools") actually look correctly themed — purple filled backgrounds, purple borders, purple glows, white text, category-colored icons. These are rendered by `renderCategoryToolCard()` using `CATEGORY_META[category].cardClass`.

However, the user reports issues. Looking at the code and screenshots more carefully:

### Problems Identified

1. **The "All Tools" bulk section cards** (rendered by `renderBulkToolCard()` at line 536-571) use `bg-black/40` with only a colored border/glow — these look dark and hollow compared to the filled category cards. The title text uses `meta.iconClass` (e.g. `text-purple-300`) which is low contrast.

2. **The global `Card` component** (`src/components/ui/card.tsx`) has `border-2 border-gold` and `hover:border-gold hover:shadow-[...]` baked in — this gold border bleeds through on ALL cards across the site, conflicting with the category-specific border colors. This is why cards show unexpected gold/blue borders.

3. **No consistent CTA button** — cards just have an `ArrowUpRight` icon that appears on hover. No "Open Tool →" text.

4. **No arrow icons visible by default** — the `ArrowUpRight` has `opacity-0 group-hover:opacity-100`, so arrows are invisible until hover.

### Fix Plan

**File: `src/components/ui/card.tsx`**
- Remove the hardcoded `border-2 border-gold` and `hover:border-gold hover:shadow-[...]` from the base `Card` component so it doesn't override category-specific borders
- Replace with neutral defaults: `border border-border` only

**File: `src/pages/AIHub.tsx`**

1. **`renderBulkToolCard` (lines 536-571)** — Fix the bulk cards:
   - Change `bg-black/40` to use the category's filled background (`meta.cardClass`) so all cards look premium and themed
   - Title text: change from `meta.iconClass` to `text-white` for consistency
   - Arrow: make always visible at `opacity-60`, full on hover
   - Add "Open →" text CTA at bottom

2. **`renderCategoryToolCard` (lines 574-608)** — Fix category cards:
   - Arrow: make always visible at `opacity-60`
   - Add "Open →" text CTA

3. **`renderLockedCard` (lines 612-646)** — Fix broker-only cards:
   - Arrow: make always visible at `opacity-60`

### Result
- All cards match their section's color theme (purple, blue, amber, pink, teal)
- Consistent white text titles
- Consistent always-visible arrow + "Open →" CTA
- No gold border bleed from the base Card component
- Premium filled backgrounds on every card

