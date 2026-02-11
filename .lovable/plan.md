

# Fix Search Dropdown -- Correct Files This Time

## Root Cause
The previous fixes edited `MegaMenuSearch.tsx`, but that component is **not used**. The actual search dropdown is `GlobalSearchModal` rendered in **embedded mode** inside a wrapper div in `GlobalHeader.tsx` (line 1506). That's why nothing changed visually.

## Changes

### 1. Fix Wrapper Container in GlobalHeader.tsx (line 1506)
**Current:** `bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl shadow-2xl`
**New:** Match Language dropdown exactly:
- Use inline style: `background: linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)`
- Shadow: `shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]`
- Add absolute gold border overlay div (same as Language dropdown)
- Add bottom gold accent bar

### 2. Fix Search Input Double-Border in GlobalSearchModal.tsx (line 296-306)
The embedded search bar uses the `Input` component which has built-in `border-2 border-gold/40` and a champagne gradient background. This creates a visible nested border.
**Fix:** Replace `Input` with a plain `<input>` element styled with `bg-transparent border-0` so only the parent's border shows.

### 3. Fix "Square Inside Square" on Quick Access Section (line 342)
The Quick Access/Popular Pages area has its own `border border-gold/30 rounded-xl shadow-inner` creating another visible nested box.
**Fix:** Remove the border, shadow-inner, and separate background from this wrapper since the parent container already provides the champagne background.

### 4. Add Hover Effects on Items
Quick Access and Popular Pages items currently use `hover:bg-black/5`. Update to `hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]` to match Language dropdown hover style.

## Files to Edit

| File | Line(s) | Change |
|------|---------|--------|
| `src/components/GlobalHeader.tsx` | 1506 | Replace wrapper gradient/border with Language dropdown style |
| `src/components/GlobalSearchModal.tsx` | 296-306 | Replace `Input` with plain `<input>`, remove double border |
| `src/components/GlobalSearchModal.tsx` | 342 | Remove nested border/shadow from Quick Access wrapper |
| `src/components/GlobalSearchModal.tsx` | 350, 367 | Update hover effects to match Language dropdown |

