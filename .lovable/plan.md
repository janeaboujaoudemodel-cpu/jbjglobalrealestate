

## Fix AI Home Finder Card Readability

**File:** `src/pages/Index.tsx`, lines 411-477
**Component:** Inline section in `Index` component
**Route:** `/`

### Problem
The card background is light champagne (`#F5EBD7 → #D4C4A8`) and the title uses a gold-to-champagne gradient text (`from-gold via-[#E8DCC8] to-gold`), creating poor contrast — gold on light gold is nearly invisible. The description is `text-zinc-700` which also blends into the warm background.

### Changes

1. **Title text** (line 459): Change gradient from `from-gold via-[#E8DCC8] to-gold` → `from-[#1a1a1a] via-[#2d2319] to-[#1a1a1a]` (near-black with warm undertone). This makes "AI Home Finder" the strongest, most readable element. On hover, shift to gold gradient for interactivity.

2. **Description text** (line 466): Change `text-zinc-700` → `text-stone-800` for stronger contrast against champagne background.

3. **"Powered by" text** (line 469): Change `text-zinc-500` → `text-stone-500` — readable but lower priority.

4. **Badge** (line 449): Change `bg-gold/15 border-gold/30 text-gold` → `bg-[#1a1a1a]/10 border-[#1a1a1a]/20 text-[#1a1a1a]` with the Sparkles icon staying gold. This makes the label clearly readable.

5. **Card border** (line 437): Strengthen from `border-gold/30` → `border-gold/50` for better card definition.

6. **Arrow icon** (line 464): Change `text-gold` → `text-stone-800` to match title weight, gold on hover.

### What stays the same
- Card background gradient (champagne)
- Card dimensions, padding, shadows
- 3D perspective transforms and hover animations
- Section background with gold orbs
- Layout structure
- Typography sizes and fonts

