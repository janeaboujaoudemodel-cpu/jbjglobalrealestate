

## SESSION 12 — AI Home Finder Visual Fix

### Current State Analysis

**Section background** (line 414): Uses dark premium brown `bg-gradient-to-br from-[hsl(38,35%,12%)] via-[hsl(36,30%,16%)] to-[hsl(34,25%,12%)]` — correct dark tone.

**Problem**: Three large gold glow orbs (lines 416-418) wash out the dark background, making it appear lighter than intended:
- Center: `w-[600px] h-[600px] bg-gold/8 blur-[120px]`
- Top-left: `w-[300px] h-[300px] bg-gold/5 blur-[80px]`
- Bottom-right: `w-[300px] h-[300px] bg-gold/5 blur-[80px]`

**Card** (line 440): Currently uses champagne gold: `from-[#F5EBD7]/95 via-[#E8DCC8]/95 to-[#D4C4A8]/95` — this is already gold champagne, BUT the `/95` opacity lets the light glow bleed through making the overall look washed out. The user wants a stronger gold champagne card.

### Fix Plan

**File: `src/pages/Index.tsx`**

#### 1. Darken the section background glow effects
Reduce the ambient glow orbs to prevent the "too light" appearance:
- Line 416: Center orb `bg-gold/8` → `bg-gold/4` (halve intensity)
- Line 417: Top-left orb `bg-gold/5` → `bg-gold/3`
- Line 418: Bottom-right orb `bg-gold/5` → `bg-gold/3`

#### 2. Change card to full-opacity gold champagne
- Line 440: Replace `from-[#F5EBD7]/95 via-[#E8DCC8]/95 to-[#D4C4A8]/95` → `from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` (remove `/95` transparency — fully opaque champagne gold)

This ensures:
- The dark brown section background reads as properly dark
- The card is a solid, warm gold champagne — not gray/black

### Files Modified
- `src/pages/Index.tsx` — 4 lines (3 glow orbs + 1 card background)

### Route
- `/` (Homepage)

### Testing Steps
1. Navigate to homepage, scroll to AI Home Finder section
2. Verify dark brown background is visibly darker than before
3. Verify card is warm gold champagne with no gray/black tone
4. Screenshot the section

