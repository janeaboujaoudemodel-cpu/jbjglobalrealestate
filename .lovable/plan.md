

# Fix Developer Cards: Remove Fake Photos, Fix Logo Borders

## Problem Summary
1. **121 developers** are using the same fake Dubai Downtown unsplash photo as their feature image -- this looks unprofessional and misleading
2. **Logo gold border** on external/directory cards should be removed (gold border only on detail pages)
3. **Logo white borders/padding** issue -- logos need full-fit rendering without visible white edges

## Part 1: Remove Fake Photo Fallback (DeveloperCard.tsx)

Replace the hardcoded unsplash downtown photo with a clean, premium gradient fallback that uses the developer's logo as the centerpiece. No more fake skyline photos.

**Current fallback (lines 66-80):**
- Shows `unsplash.com/photo-1512453979798-5ea266f8880c` for every developer without a feature image

**New fallback:**
- Premium dark gradient background (no photo)
- Developer logo displayed prominently in the center (if available)
- Building2 icon as last resort if no logo either
- Developer name overlaid for context

## Part 2: Remove Gold Border from Logo on External Cards (DeveloperCard.tsx)

**Current (line 85):**
```
style={{ border: '3px solid hsl(42 45% 59%)', boxShadow: '0 4px 16px rgba(200,167,102,0.3)' }}
```

**New:**
- Remove the gold border and gold box-shadow from the logo container
- Keep clean `bg-white rounded-lg shadow-lg` only
- This applies ONLY to the directory/listing cards, not the detail page

## Part 3: Fix Logo Full-Fit (DeveloperCard.tsx)

Remove any visible white padding around logos:
- Change from `bg-white` to `bg-black` on the logo container (blends edges)
- Use `object-cover` with slight scale to fill the frame edge-to-edge (per the full-fit standard)
- Add `p-0` to ensure zero internal padding

## Part 4: Update Developers with Project Cover Images (Edge Function)

Run the existing `sync-developer-feature-images` function to pull real project cover images for developers that currently have the fake unsplash URL. This will fix a few developers that DO have project images.

For the remaining ~115 developers without any project images, the gradient fallback from Part 1 will display cleanly until real feature images are uploaded.

## Files Changed

| File | Change |
|------|--------|
| `src/components/DeveloperCard.tsx` | Replace unsplash fallback with gradient, remove gold border from logo, fix logo full-fit |

## Technical Details

```text
DeveloperCard logo container changes:
  Before: border: 3px gold, bg-white, object-contain
  After:  no border, bg-black, object-cover, scale-[1.2], p-0

DeveloperCard fallback image changes:
  Before: Unsplash downtown skyline photo
  After:  Dark gradient + centered logo/icon (no external image)
```

