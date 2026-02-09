
# Fix Rectangular Logos — Stretch to Fill Without Cropping

## Current State
All logos use `object-cover`, which works great for square logos but **crops** rectangular/wide logos (cutting off the sides) or shows white gaps if the image has built-in whitespace padding.

## Fix
Change `object-cover` to `object-fill` on the logo `<img>` tag. This stretches the image to fill the entire 24x24 (96px) container in both directions without cropping any part of the logo.

- Square logos: no visible difference (already fill perfectly)
- Rectangular logos (like ACube): stretched vertically to fill the white gap at top and bottom, no cropping

## One-Line Change

**File: `src/components/DeveloperCard.tsx`** (line 90)

```
// Before
className="w-full h-full object-cover"

// After  
className="w-full h-full object-fill"
```

This is the only change. Everything else about the logo container (size, rounded corners, shadow, positioning) stays exactly as it is now.
