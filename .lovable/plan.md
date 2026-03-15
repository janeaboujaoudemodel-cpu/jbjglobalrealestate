

# Stamp Generator Premium Upgrade — Batch Plan

This is a massive overhaul covering ~15 distinct issues. It will be executed in **4 batches** to ensure quality. This plan covers **Batch 1** — the foundational fixes. Subsequent batches will be planned after each is verified.

---

## Batch 1: Foundation — Layout, Standard Model, Core Interactivity

### Problem Summary (Batch 1 scope)
1. **Layout broken**: Preview hidden behind header/sidebar, gray area below content, not centered
2. **Standard stamp model wrong**: Not matching the reference photo (2 circles, Arabic top half-moon, English bottom half-moon, dot separators, monogram center)
3. **Border styles not visually changing** (SINGLE/DOUBLE/RING look identical)
4. **Typography clicks not reflecting** in live preview
5. **Location text wrong**: Shows "United Arab Emirates" instead of "UAE"
6. **"Failed to create project"** error on Generate
7. **Monogram quality too low** and not resizable in preview

### Changes

#### 1. Fix Studio Layout (`StampGeneratorPage.tsx`)
- Remove gray background below the canvas area — extend the champagne gradient to fill the entire viewport
- Ensure center column has `min-h-0` and proper flex structure so it fills available space without gray gaps
- Add `top-[48px]` offset to prevent content hiding under the L-frame header
- Fix the preview container to be truly centered with `items-center justify-center` and no sidebar overlap (add `overflow-hidden` to left panel)

#### 2. Fix Standard Model SVG Template (`stampOfficialTemplate.ts`)
- Update `generateRoundStamp()` to produce the reference design:
  - **Outer circle** (bold ~4px stroke) + **Inner circle** (thinner ~2px stroke)
  - **Arabic text** curved along the top half-moon arc between the two circles
  - **English text** curved along the bottom half-moon arc between the two circles
  - **Two dot separators** at 3 o'clock and 9 o'clock positions dividing the arcs
  - **Monogram/logo** centered inside the inner circle at high resolution
  - Default ink color: `#1B3A8C` (navy/ink blue)
- For the reference photo style (2-circle, company name bilingual):
  - Remove the middle ring for the "standard" 2-ring layout, making it outer + inner only
  - Optional 3-ring layout when location text is enabled (adds a third inner circle for "Dubai, UAE" text)
- Fix location text: default to "Dubai, UAE" not "Dubai, United Arab Emirates"
- Arabic location: "دبي، الإمارات" (short form)

#### 3. Fix Border Style Differentiation (`stampOfficialTemplate.ts`)
- `SINGLE`: One outer ring only, no decorative or middle ring
- `DOUBLE`: Outer ring + inner ring (the reference photo style)
- `RING`: Outer + decorative + middle + inner (4 rings, thick)
- `DOTTED`/`ROPE`/`CUSTOM`: Apply dash patterns to outer ring
- Currently all render identically because the middle ring always renders — gate it by `borderStyle`

#### 4. Improve Monogram Rendering Quality (`stampOfficialTemplate.ts`)
- Increase `centerR` from `S * 0.14` to `S * 0.18` for larger default monogram area
- When logo is uploaded, use `image-rendering="optimizeQuality"` and increase clip circle
- Wire `centerContentScale` to actually scale the monogram/logo proportionally
- In `injectCenterArt()` in `StampGeneratorPage.tsx`: increase `imgSize` from `centerR * 1.6` to `centerR * 2.2`

#### 5. Fix Live Preview Wiring
- Ensure border style changes trigger live re-render by adding `project?.border_style` to the `useEffect` dependency array in the live render pipeline
- Ensure typography style changes trigger re-render by adding `project?.typography_style` to deps
- Ensure separator style changes trigger immediate re-render (currently calls `generateConcepts` which is heavy — switch to direct SVG regeneration like other controls)

#### 6. Fix "Failed to create project" Error
- Check the edge function `ai-stamp-generator` — the `generate` action inserts into `stamp_designs` table; verify the insert payload matches the table schema
- Add better error handling and surface the actual error message to the user
- Ensure `project_id` foreign key exists in `stamp_projects` before inserting designs

#### 7. Deploy Edge Function
- Redeploy `ai-stamp-generator` edge function with fixes

---

## Future Batches (planned, not yet detailed)

**Batch 2**: Interactive preview — click-to-select elements, drag/resize monogram, inline editing, element deletion from preview, lock/unlock controls

**Batch 3**: AI workflow — trade license auto-detection of business type, smart generation based on industry, regeneration with style variations, undo/redo/reset/save draft fully wired

**Batch 4**: Premium polish — owner's official standard fixed as permanent T0, separator customization (dots/stars/dash/circles/none), reverse Arabic/English positioning, show/hide location toggle, color reset to standard ink, export fixes

---

## Technical Details

### Files Modified (Batch 1)
| File | Changes |
|------|---------|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Layout fixes, dependency array fixes, monogram quality |
| `src/lib/stampOfficialTemplate.ts` | Border differentiation, 2-ring standard model, location text shortening, monogram scaling |
| `src/components/stamp-generator/LiveStampPreview.tsx` | Wire border/typography changes to live re-render |
| `supabase/functions/ai-stamp-generator/index.ts` | Fix generation errors, sync template engine |

### Key Architecture Decision
The standard model will use a **2-circle layout** by default (matching the reference photo), with an optional 3rd inner circle when location text (Dubai, UAE) is enabled. This matches real-world UAE company stamps.

