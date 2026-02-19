
# Verification Results & Remaining Fixes

## What Was Verified ✅

**1. Preview Stability** — CONFIRMED WORKING. The video preview stays stable and centered when tool panels open. It never collapses.

**2. Beauty Filters — Video Support** — CONFIRMED WORKING. The panel shows "Apply professional filters to images & video frames" and the drop zone says "Drop image or video here" with MP4, MOV, WebM in the accepted formats. The `accept="image/*,video/*"` attribute is correctly set.

**3. Text Presets — Click to Add** — CONFIRMED WORKING. All 5 presets (Clean Title, Lower Third, Social Bold, Luxury Quote, Caption Box) are visible with sub-labels. Clicking "Clean Title" immediately fires the add action.

**4. Stock Tab Category Buttons** — CONFIRMED WORKING. All, Music, SFX, Ambient buttons are visible with correct high-contrast styles (amber for active, slate-700 with border for inactive).

---

## Issues Still Needing Fixes ❌

### Fix 1: AI Scene Generator Fails (Root Cause: Wrong Architecture)
**What's broken:** The `handleGenerateScene` function in `MediaLibraryPanel.tsx` calls `https://ai.gateway.lovable.dev/v1/chat/completions` **directly from the browser** using the anon key as `Authorization`. This fails with `net::ERR_FAILED` because AI gateway calls must be made **server-side** from an Edge Function — not from the browser.

**What to change:** Move the scene generation call into the existing `ai-video-editor` Edge Function by adding a new `action: 'generate-scene'` branch. The Edge Function already has `LOVABLE_API_KEY` wired up. The frontend will call the edge function instead.

**Second bug:** The model used is `google/gemini-2.5-flash-image` which does not exist. The correct model for image generation from the supported list is `google/gemini-3-pro-image-preview`.

**Files changed:**
- `supabase/functions/ai-video-editor/index.ts` — add `generate-scene` action using `google/gemini-3-pro-image-preview` with `modalities: ['image','text']`
- `src/components/ai-video-studio/panels/MediaLibraryPanel.tsx` — change `handleGenerateScene` to call the edge function at `/functions/v1/ai-video-editor` with `{ action: 'generate-scene', prompt: aiPrompt }`

### Fix 2: Stock Asset Cards Have Near-Invisible Icon Thumbnails
**What's broken:** Stock audio cards with no thumbnail render a small icon on `bg-amber-900/40` — this 40% opacity amber-on-dark is too subtle in a narrow 2-col grid. The card face looks like an almost-black box with only a tiny icon. The "Add" and "Preview" buttons on hover use `variant="ghost"` for "Preview" which makes that button invisible when the overlay shows.

**What to change:**
- Increase the icon background opacity from `/40` to `/60` and make the icon larger (`w-8 h-8` instead of `w-6 h-6`) for better visibility
- Add a subtle colored border/gradient to the thumbnail area for audio cards to visually distinguish them
- Fix the "Preview" hover button from `variant="ghost"` to explicit `bg-slate-700 text-white` so it's always visible in the hover overlay

**File changed:** `src/components/ai-video-studio/panels/MediaLibraryPanel.tsx` — update `getIconBg()` opacity values and the "Preview" button variant in the `AssetCard` hover overlay.

---

## Technical Detail: Edge Function Change for Generate Scene

```typescript
// supabase/functions/ai-video-editor/index.ts — new branch added:
} else if (action === 'generate-scene') {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3-pro-image-preview',
      messages: [{ role: 'user', content: `Generate a cinematic real estate scene: ${prompt}` }],
      modalities: ['image', 'text'],
    }),
  });
  // Extract image from response and return as base64
}
```

```typescript
// MediaLibraryPanel.tsx — updated call:
const { data, error } = await supabase.functions.invoke('ai-video-editor', {
  body: { action: 'generate-scene', prompt: aiPrompt },
});
```

## Summary of Changes

| File | Change |
|---|---|
| `supabase/functions/ai-video-editor/index.ts` | Add `generate-scene` action using correct `google/gemini-3-pro-image-preview` model via `LOVABLE_API_KEY` |
| `src/components/ai-video-studio/panels/MediaLibraryPanel.tsx` | Route scene generation through edge function; fix stock card icon visibility |
