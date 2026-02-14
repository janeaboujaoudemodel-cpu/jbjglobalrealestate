

## Remove Logo Background Box on External Listing Cards Only

### Scope

Only the **external listing cards** (the cards you see in grids/lists before clicking into a project) will be changed. The **internal project detail page** with its gold-framed logo will NOT be touched.

### Cards to Update (3 files)

1. **DeveloperCard.tsx** -- Developer directory grid cards
2. **ReellyProjectCard.tsx** -- Project listing cards on the Properties page
3. **ProjectCard.tsx** -- Project listing cards used elsewhere

### What Changes

For each card, the logo overlay will go from a **colored/white background box** to a **direct logo image** with rounded corners:

- Remove the container `div` with background color (`bg-white`, `logo_bg_color`)
- Display the `<img>` tag directly with:
  - `rounded-lg` for rounded corners matching the current box style
  - `shadow-lg` for a subtle drop shadow so logos pop against any background
  - `object-contain` to keep logos fully visible without cropping
  - `border border-white/30` for subtle edge definition against dark photos
- Same size and position (w-12/w-14, absolute top-3 left-3)
- Fallback icon (Building2) renders without a background box

### What Does NOT Change

- **Project detail page** (gold-framed logo) -- untouched
- **RecommendedProjects.tsx** -- untouched (internal card)
- The `logo_bg_color` database column stays, just no longer used by these 3 card components
- No logo images are modified or replaced

### Technical Details

| File | Current | After |
|------|---------|-------|
| `DeveloperCard.tsx` (line 96) | `div` with `backgroundColor: logoBgColor` wrapping `img` | Direct `img` with `rounded-lg shadow-lg border border-white/30` |
| `ReellyProjectCard.tsx` (line 159) | `div` with `bg-white border-2 border-gold` wrapping `img` | Direct `img` with `rounded-lg shadow-lg border border-white/30` |
| `ProjectCard.tsx` (line 205) | `div` with `bg-white` wrapping `img` | Direct `img` with `rounded-lg shadow-lg border border-white/30` |

