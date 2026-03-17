

## Fix AI Home Finder Section Spacing & Visual Enhancement

**File:** `src/pages/Index.tsx`  
**Route:** `/`

### Changes

#### 1. Spacing Fix — Bottom padding (lines 414, 479)
Currently the section has `py-16 md:py-20` (64px/80px). The bottom feels cramped because the card's glow layers extend beyond the card but the padding doesn't account for it.

**Fix:** Change to `py-16 md:py-24` (64px/96px) — adds 16px more bottom breathing room at desktop to match the visual weight of the glow beneath the card.

#### 2. Card Visual Enhancement (line 439, 441)
- **Border:** `border-gold/50` → `border-gold/60` — slightly stronger definition
- **Shadow:** Add a subtle outer gold shadow layer: append `0 4px 20px rgba(200,167,102,0.15)` to existing boxShadow for soft lift

#### 3. AI Badge — Subtle Purple Tint (line 451)
Currently uses `bg-[#1a1a1a]/10 border-[#1a1a1a]/20 text-[#1a1a1a]`.

**Change to:** `bg-purple-900/10 border-purple-800/20 text-purple-900` — very subtle purple tint on the badge only. The Sparkles icon gets `text-purple-700` to hint at AI without changing the card's luxury gold palette.

#### 4. No changes to
- Section layout, surrounding sections, sidebar, header
- Card 3D transforms, animations, overall champagne/gold color system
- SectionDivider placement (already correct above and below)

### Spacing Values
- Top padding: 64px (mobile) / 96px (desktop) — unchanged top
- Bottom padding: 64px (mobile) / 96px (desktop) — increased from 80px
- Card max-width: 672px (`max-w-2xl`)

