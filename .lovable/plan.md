

## Fix All Developer Logo Background Colors

### Problem

Two issues with the current server-side color extraction:

1. **365 developers have no color at all** -- their logos are WebP format, which the current function cannot decode, so they default to white
2. **Many processed developers have wrong colors** -- the algorithm only samples 4 corner pixels, which picks up compression artifacts or edge pixels instead of the true background color (e.g., Nakheel shows black instead of navy blue)

### Solution

#### 1. Upgrade the Edge Function

Replace the current image decoder with a library that supports WebP, PNG, JPEG, and GIF. Use the `imagescript` Deno library which handles all common formats natively.

Improve the color extraction algorithm:
- Instead of sampling just 4 corner pixels, sample the **entire border region** (top row, bottom row, left column, right column) of the image
- Group similar colors together and pick the most frequent one
- This captures the true background color even if a few edge pixels have compression artifacts
- Transparent pixels still default to white

#### 2. Reset and Re-Process All Developers

- Clear all existing `logo_bg_color` values so every developer gets re-processed with the improved algorithm
- Run the function in batches of 10 (increased from 5) to process all 535 developers
- Accept a `reset` parameter to trigger the bulk reset
- Accept a `batch_size` parameter for flexibility

#### 3. Manual Corrections for Key Developers

After the batch run, manually verify and correct colors for the developers the user specifically mentioned:
- Nakheel: navy blue (not black)
- Aldar: brown/bronze tone
- Ellington: black
- Danube: red
- Others as needed based on visual inspection

These manual corrections will override the algorithm if it still gets edge cases wrong.

### Technical Details

| Step | Action |
|------|--------|
| 1 | Update `supabase/functions/extract-logo-colors/index.ts` to use `imagescript` library for WebP/PNG/JPEG/GIF support |
| 2 | Replace corner-only sampling with full border-region sampling (all pixels along all 4 edges) |
| 3 | Add `reset=true` query param support to clear all colors and re-process from scratch |
| 4 | Increase batch size to 10 per invocation |
| 5 | Deploy the updated function |
| 6 | Call the function with `reset=true` once to clear old data |
| 7 | Call the function repeatedly until all 535 developers are processed |
| 8 | Manually correct any remaining mismatched colors for key developers |

### No Frontend Changes Needed

The `DeveloperCard.tsx` already reads `developer.logo_bg_color` and applies it as the logo container background (line 44, 96). Once the database has correct colors, the UI will automatically reflect them.

