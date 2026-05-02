## Goal

Make all the cards listed below use the **same champagne color as the vertical sidebar background (`#F7F2EA`)** instead of the current `#FDFBF7` (page tone) or white. Also restyle the footer social row so every icon uses the same gold-circle/black-glyph hover treatment that YouTube and TikTok already share.

## Color contract

- Sidebar/raised surface = `#F7F2EA` ← **target card color**
- Page background       = `#FDFBF7` ← stays as section/page bg
- Inner pill/icon tile  = `#EFE6D6` (one tone deeper, only where current code uses `#F7F2EA` as an inner accent inside a card we're elevating)
- Border                = `#B89555/40` (gold hairline, unchanged)

When a card is moved from `#FDFBF7` → `#F7F2EA`, any nested element currently using `#F7F2EA` as its accent will shift to `#EFE6D6` so we keep visible separation between the card surface and its inner tiles.

## Sections to update

### Home page
1. **Category Selector — three role cards** (`src/components/home/CategorySelectorSection.tsx`)
   Investor / Broker / Developer cards: `bg-[#FDFBF7]` → `bg-[#F7F2EA]`.

2. **Starting Point Section — JBJ Royal Tools card + inner 8 cards** (`src/components/home/StartingPointSection.tsx`)
   - Outer wrapper card → `#F7F2EA`
   - Inner mini-cards currently `#FDFBF7` → `#F7F2EA`
   - Inner icon tiles previously `#F7F2EA` → `#EFE6D6` (so they stay distinguishable)

3. **Toolkit Showcase Card — main "AI Property Comparison / Royal Tools" hero card** (`src/components/home/ToolkitShowcaseCard.tsx`)
   - Outer card → `#F7F2EA`
   - Inner tool cards `#FDFBF7` → `#F7F2EA`
   - Header strip currently `#F7F2EA` → `#EFE6D6` (deeper accent strip)

4. **AI Property Comparison Widget** (`src/components/AIComparisonWidget.tsx`)
   - Property comparison rows + container → `#F7F2EA`
   - The internal accent block currently `#F7F2EA` → `#EFE6D6`

5. **Mortgage Calculator** (`src/components/MortgageCalculator.tsx`)
   - All result/input panel cards `#FDFBF7` → `#F7F2EA`

6. **Overseas Investors Banner — "Invest in Dubai from anywhere"** (`src/components/home/OverseasInvestorsBanner.tsx`)
   - Stat cards `#FDFBF7` → `#F7F2EA`
   - Inner icon circles `#F7F2EA` → `#EFE6D6`

7. **Why Choose Us cards** (`src/components/home/WhyChooseUs.tsx`)
   - Feature cards `#FDFBF7` → `#F7F2EA`
   - Icon tiles `#F7F2EA` → `#EFE6D6`

8. **Ready to Get Started container** (`src/components/home/CTABand.tsx`)
   - Main card holding the three-card loop → `#F7F2EA`
   - Inner three cards keep their existing tone but if they currently use `#FDFBF7`, keep them so they pop against the now-champagne parent. If they use `#F7F2EA` already, shift them to `#EFE6D6` for separation.

### Footer
9. **Footer "white card" → champagne card** (`src/components/Footer.tsx`)
   The brand/connect chip currently uses `bg-[#FDFBF7]/[0.03]` (almost-transparent on dark). Replace with a solid champagne card: `bg-[#F7F2EA]` with ink text + gold border, matching the rest of the site.

10. **Footer social icons** (`src/components/marketing/SocialLinks.tsx`)
    Update the `premium` variant (used in the footer) so every icon — Facebook, Instagram, LinkedIn, YouTube, TikTok — renders as:
    - 36px circle, `bg-[hsl(var(--gold))]/15`, gold border
    - **Glyph color: `#1A1A1A` (black)** instead of the current gold
    - Hover: fills to solid gold (`bg-[hsl(var(--gold))]`), glyph stays/becomes ink, scales 1.06, gold glow shadow
    
    All five icons already share one className via `colorClasses`, so all five automatically get the unified style — i.e. YouTube/TikTok behavior is propagated to the others, with the glyph color flipped from gold to black per the request.

## No-Removal guarantee

Per project memory's strict "No Removal" policy: this is a color-only restyle. No layout, content, animation, link, or component is removed or rearranged.

## Technical notes

- Edits are localized className swaps; no new components, no token additions to `index.css` (the values `#F7F2EA`, `#FDFBF7`, `#EFE6D6` are already the project's standard champagne tokens).
- Social icon update is a single change in `SocialLinks.tsx` (`premium` variant string) — applies across the footer and any other premium consumer.
- After edits I'll spot-check that text contrast on the new `#F7F2EA` cards still meets the existing global contrast guard (ink `#1A1A1A` on `#F7F2EA` is well above WCAG AA, so no additional changes needed).

## Files to edit

- `src/components/home/CategorySelectorSection.tsx`
- `src/components/home/StartingPointSection.tsx`
- `src/components/home/ToolkitShowcaseCard.tsx`
- `src/components/AIComparisonWidget.tsx`
- `src/components/MortgageCalculator.tsx`
- `src/components/home/OverseasInvestorsBanner.tsx`
- `src/components/home/WhyChooseUs.tsx`
- `src/components/home/CTABand.tsx`
- `src/components/Footer.tsx`
- `src/components/marketing/SocialLinks.tsx`
