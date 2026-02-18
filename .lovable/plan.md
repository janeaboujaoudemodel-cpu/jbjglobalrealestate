
# Background Remover — Complete Fix Plan

## Root Cause (Confirmed by Code Review)

The current `removeBackgroundClientSide` function (lines 65–200 of `BackgroundAI.tsx`) uses a primitive **corner-sampling + Euclidean color distance** algorithm:

1. It samples 8 corner pixels and averages their RGB values as the "background color"
2. It loops through every pixel and makes it transparent if it's within `tolerance=40` of that average
3. **Critical flaw**: This removes ANY pixel matching the background color — including skin, hair, clothing, teeth — anything that shares similar tones with the background

**Why changing the background preset also corrupts the subject:**
When the user selects "White", "Navy", "Blur" etc., the code first fills a canvas with that color, THEN draws the image over it, THEN runs the color-matching removal. The algorithm now samples from the already-filled background canvas, but still affects the subject. Additionally, the new background color is being composited incorrectly — the algorithm mutates `layerData` (the original image pixels), not a copy, so the new background bleeds into the subject mask.

## The Correct Solution

**Two-tier approach:**

### Tier 1 — AI-Powered Removal (Primary, Via Edge Function)
Use the `ai-background-remove` edge function to call **Gemini Vision** with a specific prompt to return a **segmentation mask** or a clean cutout. The model is given the image and instructed to describe exactly which pixels to remove. For the actual cutout, we switch the mode to call the AI API with a **"remove background, return PNG with transparency"** instruction using the `google/gemini-3-flash-preview` model which supports image analysis + generation.

Actually, since the AI image generation model (`google/gemini-3-pro-image-preview`) can take an image and produce a modified one, we use it for both "remove" and "generate" modes — the difference is just the prompt:
- **Remove mode**: "Remove the background from this image completely and return ONLY the subject with a transparent background as a PNG"
- **Generate mode**: "Take the person from this image and place them in: [scene]"

### Tier 2 — Smart Client-Side Fallback (GrabCut-style)
Replace the broken corner-sampling with a proper **flood-fill seeded from edges** (similar to GrabCut):
1. Use a `visited` bitset and BFS flood-fill from all 4 image borders
2. Only remove pixels connected to the border that are "background-like" (similar to their border neighbors) — this prevents removing interior subject pixels even if they share a color
3. Apply a small feather/blur on the mask edges for smooth cutouts
4. This works reliably for photos with clear subject/background separation

The background preset buttons (White, Navy, Blue Gradient etc.) will:
- Work on the RESULT image (the already-removed transparent cutout)
- Simply composite the transparent cutout OVER the chosen background — never re-running removal
- So choosing "Navy" after removal just changes the backdrop, never touching the subject pixels again

## Files to Change

### 1. `src/pages/toolkit/BackgroundAI.tsx`
**Replace the broken `removeBackgroundClientSide` function with a proper implementation:**

```
NEW ALGORITHM — Flood-fill from borders (GrabCut-style):
1. Load image onto canvas
2. Get pixel data
3. BFS flood-fill starting from all edge pixels:
   - A pixel is "background" if its color is within distance threshold of its flood-fill neighbors
   - Only pixels connected to the edge can be removed (protects interior pixels with same color)
4. Build binary mask: background=0, subject=255
5. Dilate+erode the mask to fill holes (morphological close)
6. Gaussian-blur the mask edges for anti-aliasing (feathering)
7. Apply mask as alpha channel to original image pixels
8. Composite over chosen new background
```

**Separate "apply background" from "remove background":**
- `removeBackground(file)` → returns RGBA image with subject only (transparent BG)
- `applyBackground(transparentDataUrl, backgroundId)` → composites transparent image over new BG
- Preset buttons change `selectedBackground` state which re-runs `applyBackground` on the already-removed result — they NEVER re-run removal

**Add proper state flow:**
```
uploadedImage → [Remove BG] → transparentResult (cached) → [Select BG preset] → finalResult
```

So after the first removal, changing the background preset is instant (no re-processing).

**UI changes:**
- After removal succeeds, show background preset grid below the result (for instant switching)
- "Remove Background" button only needs to be clicked once — after that, preset switching is instant
- Add a "Re-process" button to redo removal if needed
- Progress: 10% → loading, 60% → processing pixels, 90% → applying mask, 100% → done

### 2. `supabase/functions/ai-background-remove/index.ts`
**Add a proper AI-powered removal mode:**

Add `mode === "remove"` handler that:
- Takes the base64 image
- Calls `google/gemini-3-pro-image-preview` with prompt: "Remove the background completely from this image. Return only the subject (person/object) isolated with a pure transparent background. The subject should be perfectly cut out with no background remnants."
- Returns the generated image (transparent PNG)
- Falls back gracefully if the model returns text instead of image

**Also fix the `generate` mode** to first remove the background cleanly, then composite:
- Step 1: Remove BG → get transparent cutout
- Step 2: Generate new background scene using AI
- Step 3: Composite (the frontend handles this since it has both images)

## State Architecture Fix

```
State:
  image: File | null                    ← original uploaded file
  transparentResult: string | null      ← cached PNG with BG removed (alpha)
  finalResult: string | null            ← final composited image (shown to user)
  selectedBackground: string            ← 'transparent' | 'white' | 'navy' | etc.

Flow:
  Upload → image set
  Click "Remove Background" → AI/canvas removes BG → transparentResult set
  Change preset → applyBackground(transparentResult, preset) → finalResult updated (instant)
  Click "Download" → downloads finalResult
```

This separation is key — the subject is extracted ONCE, backgrounds are applied/changed instantly without re-running removal.

## Summary of Changes

| File | Change |
|------|--------|
| `BackgroundAI.tsx` | Replace broken `removeBackgroundClientSide` with GrabCut-style flood-fill; separate removal from background application; add `transparentResult` state; fix preset buttons to instantly swap backgrounds without re-running removal |
| `ai-background-remove/index.ts` | Add `mode === "remove"` AI handler using `gemini-3-pro-image-preview`; improve fallback handling |

## Implementation Order
1. Fix `BackgroundAI.tsx` — new flood-fill algorithm + state separation (works offline, no API needed for basic removal)
2. Update edge function — add AI-powered removal mode as the primary path, flood-fill as fallback
3. Wire up the AI removal call in `BackgroundAI.tsx` — try AI first, fall back to canvas
