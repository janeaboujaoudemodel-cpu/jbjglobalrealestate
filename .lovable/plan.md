

# Fix Duplicate Desktop Recommendation Banner

## Problem
When loading on mobile, two "best experience on desktop" messages appear simultaneously:
1. A **fixed banner at the top** (overlays the header) — pearl/champagne gradient with gold accents
2. A **toast notification at the bottom** — default toast styling

## Solution
- **Remove** the top fixed banner entirely (lines 235-242 in `MainLayout.tsx`)
- **Restyle the bottom toast** to match the top banner's premium look: pearl-to-champagne gradient background (`#FDFBF7` → `#EFE6D6`), gold icon, gold border, and the same text styling

## Changes

### `src/components/MainLayout.tsx`
1. **Delete** the fixed banner JSX block (the `<div className="fixed top-0 ...">` block, lines 235-242)
2. **Update the toast call** (lines 218-222) to use styled options matching the deleted banner's colors:
   - Custom `className` or `style` with `background: linear-gradient(to right, #FDFBF7, #EFE6D6)`, `border: 1px solid` gold/30, `color: black/80`, and a gold Monitor icon
   - Keep the same message text: "For the best experience on our full portal, use a desktop browser."

## Files Modified
- `src/components/MainLayout.tsx` — 1 file only

