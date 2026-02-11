
## Fix: Dubai Properties and Majid Al Futtaim Logos Getting Cropped

### Problem
Dubai Properties (scale 1.4) and Majid Al Futtaim (scale 1.2) are scaled up beyond what fits in the `w-[140px] h-[36px]` container with `overflow-hidden`, causing them to be cropped/cut off at the edges and bottom.

### Solution
**File:** `src/components/DeveloperPartnersMarquee.tsx`

1. **Reduce scale values to prevent cropping**
   - Dubai Properties: change `scale: 1.4` down to `scale: 1.0` (same as Sobha which looks correct)
   - Majid Al Futtaim: change `scale: 1.2` down to `scale: 1.0`

2. **Give these two logos wider containers** to compensate for their naturally wider/taller aspect ratios
   - Add an optional `width` property to the developer config
   - Dubai Properties: `width: 160` (slightly wider to let the text breathe)
   - Majid Al Futtaim: `width: 170` (its logo text is long)
   - All others stay at the default `140px`

3. **Update the render function** to use `developer.width ?? 140` for the container width instead of the hardcoded `w-[140px]` class

This approach keeps every logo fully visible (no cropping) while giving the naturally wider logos enough room to be readable -- just like Sobha Realty which displays cleanly on two lines at scale 1.

### Technical Details

| Logo | Current Scale | New Scale | Current Width | New Width |
|------|--------------|-----------|---------------|-----------|
| Dubai Properties | 1.4 | 1.0 | 140px | 160px |
| Majid Al Futtaim | 1.2 | 1.0 | 140px | 170px |
| All others | unchanged | unchanged | 140px | 140px |

Only one file is changed: `src/components/DeveloperPartnersMarquee.tsx`
