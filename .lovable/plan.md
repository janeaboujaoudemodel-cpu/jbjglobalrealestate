

## Remove Logo Background Box, Show Logo Directly with Rounded Borders

### Problem

The developer logo overlay on the DeveloperCard currently sits inside a colored background box (w-14 h-14 with `logo_bg_color`). Many developers have incorrect or missing background colors, making logos look broken. The user wants to eliminate this box entirely.

### Solution

Remove the background-color container box and display the logo image directly with a slight border-radius to match the card's rounded style. No more `logo_bg_color` dependency.

### Changes

**File: `src/components/DeveloperCard.tsx`**

- Remove the `logoBgColor` variable (line 44) -- no longer needed
- Replace the logo overlay container (lines 95-112):
  - Remove the outer `div` with `backgroundColor: logoBgColor`
  - Render the `<img>` directly with `rounded-lg` (to match the current box rounding), a subtle `shadow-lg` drop shadow, and `object-contain`
  - Keep the same size (w-14 h-14) and position (absolute top-3 left-3)
  - Add a thin transparent/white border for visual definition against dark photos: `border border-white/20`
  - For the fallback (no logo), keep the Building2 icon but without a background box -- just a simple rounded icon
- No changes to any other files -- `logo_bg_color` is only used in this one component

### Result

- Logos render directly on top of the feature image with no background box
- Rounded corners (`rounded-lg`) maintain the premium card style
- All logos become fully visible regardless of `logo_bg_color` database state
- The `logo_bg_color` column stays in the database but is no longer consumed by the UI

