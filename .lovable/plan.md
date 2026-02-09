
# Fix Developer Logo Containers -- Square Shape with No Cropping

## Problem

The logo containers are wide rectangles (`w-32 h-20` = 128x80px on cards, `w-40 h-24` = 160x96px on detail, `w-48 h-32` = 192x128px on info card). Combined with `object-cover`, logos with different aspect ratios get cropped on sides or top/bottom.

## Solution

Change the containers to **square** dimensions and switch back to `object-contain` so logos are never cropped, but remove the white background and instead use a subtle champagne/transparent tint so there are no harsh white borders visible against the card.

| Location | Current Size | New Size | Ratio |
|---|---|---|---|
| DeveloperCard.tsx (directory cards) | `w-32 h-20` (128x80) | `w-24 h-24` (96x96) | 1:1 square |
| DeveloperDetail.tsx (detail page header) | `w-40 h-24` (160x96) | `w-32 h-32` (128x128) | 1:1 square |
| DeveloperInfoCard.tsx (project page) | `w-48 h-32` (192x128) | `w-36 h-36` (144x144) | 1:1 square |

### Styling Changes (all 3 files)
- Container: change to square dimensions as above
- Image: `object-cover` back to `object-contain` with `p-1.5` padding so logos breathe
- Background: keep `#FFFFFF` (white is standard for logo display and ensures readability)

This ensures:
- No cropping -- every logo is fully visible
- No awkward white gaps on sides -- square container matches most logo proportions
- Consistent sizing across all developers

## Files to Modify

| File | Change |
|---|---|
| `src/components/DeveloperCard.tsx` | Line 86: `w-32 h-20` to `w-24 h-24`; Line 97: `object-cover` to `object-contain p-1.5` |
| `src/pages/DeveloperDetail.tsx` | Line 149: `w-40 h-24` to `w-32 h-32`; Line 160: `object-cover` to `object-contain p-2` |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Line 59: `w-48 h-32` to `w-36 h-36`; Line 68: `object-cover` to `object-contain p-2` |
