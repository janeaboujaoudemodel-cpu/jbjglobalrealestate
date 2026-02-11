

# Fix Search Dropdown to Match Language Dropdown Exactly

## What's Wrong

The previous fix didn't actually work because of several mismatches:

1. **Wrong gradient colors** -- Search uses a lighter gradient (`#FDFBF7, #F5F0E6, #EDE4D3`) while Language uses a deeper champagne (`#F5EBD7, #E8DCC8, #D4C4A8`). They need to be identical.
2. **Search bar double-border still visible** -- The override class `!border-2-none` is not a valid Tailwind class, so the Input component's built-in `border-2 border-gold/40` is still rendering, creating the "square inside square" look.
3. **Missing shadow, border overlay, and bottom gold accent** -- Language uses a deep shadow, an absolute-positioned gold border overlay, and a gold accent bar at the bottom. Search has none of these.
4. **No hover effects on links** -- Language items turn gold on hover with a subtle background shift. Search links don't have this treatment.

## Changes

### File: `src/components/header/MegaMenuSearch.tsx`

**Container div (line 98-104):**
- Change gradient from `#FDFBF7, #F5F0E6, #EDE4D3` to `#F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%` (matching Language exactly)
- Change shadow from `shadow-xl` to `shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]`
- Remove `border-2 border-gold/40` from the container class (will use absolute overlay instead)
- Add an absolute `border-2 border-gold/40` overlay div inside (same as Language)
- Add bottom gold accent bar (`h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50`)

**Search Input (line 110-119):**
- Replace the `Input` component with a plain `<input>` element to avoid the built-in gradient and double border entirely
- Style it with: `bg-white/80 border border-gold/30 rounded-xl h-12 px-4 text-base text-black` -- clean, single border, no gradient clash

**Link hover effects:**
- Add `hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]` and `group-hover:text-gold` to service and navigation links so they match Language dropdown hover behavior

## Technical Details

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Wrong dropdown color | Different gradient stops | Use exact Language gradient: `#F5EBD7, #E8DCC8, #D4C4A8` |
| Double-border on search bar | `!border-2-none` is invalid CSS; Input has `border-2` baked in | Use plain `<input>` instead of `Input` component, apply clean single border |
| Missing visual elements | No border overlay, no bottom accent | Add absolute border overlay div + bottom gold accent bar |
| No hover effect | Links missing hover background/color | Add matching hover classes from Language dropdown |

Only one file needs editing: `src/components/header/MegaMenuSearch.tsx`

