
# Fix 404 Page Logo and Header

## Issues Identified

### 1. Broken Logo on 404 Page
**Problem**: The 404 page uses `jbj-monogram-transparent.png` which doesn't display correctly on the champagne card background (shown in your screenshot as a broken/invisible "B" in a box).

**Solution**: Replace with `jbj-monogram-light-bg.png` - the same logo used in the Chat Support widget (ChatWelcome.tsx), which is specifically designed for light/champagne backgrounds.

### 2. Header Should Be Solid Black on 404 Pages
**Problem**: The header shows as transparent on 404 pages, but since there's no dark hero section, the header should be solid black.

**Solution**: The 404 page doesn't render a `.jj-hero-fullscreen` element, so the MainLayout's `useLayoutEffect` should already detect this and set `forceSolid={true}` for the header. However, the NotFound page has a `min-h-screen bg-black` background which might be causing confusion. We need to ensure the header is forced solid for ALL pages without a hero section, including 404.

---

## Technical Changes

### File 1: `src/pages/NotFound.tsx`

**Change the logo import and usage:**

| Current | New |
|---------|-----|
| `import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png"` | `import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png"` |
| `src={jbjMonogramTransparent}` | `src={jbjMonogramLightBg}` |

This matches the Chat Support widget exactly - same logo asset for same background color.

### File 2: `src/components/MainLayout.tsx`

**No changes needed** - The current logic already handles this:
- The NotFound page does NOT have a `.jj-hero-fullscreen` element
- The `useLayoutEffect` checks for this element and sets `hasDarkHero = false`
- This sets `needsHeaderSpacing = true` and passes `forceSolid={true}` to GlobalHeader
- The header will be solid black with proper spacing

The logic is correct - the 404 page content should be pushed below the solid header with padding.

---

## Visual Result

| Element | Before | After |
|---------|--------|-------|
| 404 Logo | Broken/invisible on champagne card | Clear monogram with proper background |
| Header | Transparent over black bg | Solid black (same as on scroll) |
| Content | May slide under header | Proper spacing below header |

---

## Files to Modify

1. **`src/pages/NotFound.tsx`** - Update logo import from transparent to light-bg version
