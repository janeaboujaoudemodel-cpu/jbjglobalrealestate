
# Beauty Filters: Real-Time CSS Preview on the Active Video Clip

## What Needs to Change

Currently `BeautyFiltersPanel` is a fully self-contained island — it manages its own file upload, its own canvas, and applies filters there. The video clip playing in `VideoPreviewCanvas` knows nothing about what the Beauty panel is doing.

The fix uses the **same state-bridge pattern already in place for overlay effects**: lift the filter state up into `AIVideoStudio.tsx`, pass it down into `VideoPreviewCanvas` where the `<video>` element lives, and apply a CSS `filter` string directly to that element in real time.

No canvas capture or frame extraction is needed — CSS `filter` works natively on `<video>` elements in all modern browsers.

---

## Architecture

```text
BeautyFiltersPanel
  └── calls onFilterChange(adjustments) on every slider move / preset click

AIVideoStudio.tsx
  └── activeBeautyFilter state  ← lifted here
  └── passes to VideoPreviewCanvas as prop

VideoPreviewCanvas
  └── applies computed CSS filter string to the <video> element's style
  └── also applies to <img> elements if an image clip is active
```

The CSS filter string computed from slider values:
```
brightness(105%) contrast(110%) saturate(90%) sepia(8%) blur(0px)
```
Vignette is a radial gradient `<div>` overlay (CSS filter cannot do vignette), so it is handled as an absolutely-positioned overlay div on top of the video, matching what the canvas version already does.

---

## Files to Change

### 1. `src/components/ai-video-studio/features/BeautyFiltersPanel.tsx`
**What changes:**
- Add an `onFilterChange?: (adjustments: Adjustments | null) => void` prop
- Keep the existing upload/canvas section intact — it still works for downloading filtered images
- Every time a slider moves (`updateAdjustment`) or a preset is clicked (`applyPreset`), also call `onFilterChange(adjustments)` with the new values
- Add a "Clear Filter" button that calls `onFilterChange(null)` and resets local state to the "none" preset — so users can remove the live preview from the canvas
- The panel still shows the upload/canvas section below (for image download use), but the top of the panel now shows a "Live Preview" status badge when the filter is active on the canvas
- Remove the self-contained upload gate from the top-of-panel path — the presets and sliders are shown immediately at the top (like the Resize panel fix), with the image download section below as an optional secondary feature

### 2. `src/components/ai-video-studio/AIVideoStudio.tsx`
**What changes:**
- Add `activeBeautyFilter` state: `useState<Adjustments | null>(null)` where `Adjustments` is imported or inlined as the same type used by the panel
- Pass `onFilterChange={setActiveBeautyFilter}` to `<BeautyFiltersPanel>`
- Pass `beautyFilter={activeBeautyFilter}` to `<VideoPreviewCanvas>`

### 3. `src/components/ai-video-studio/preview/VideoPreviewCanvas.tsx`
**What changes:**
- Add `beautyFilter?: { brightness: number; contrast: number; saturation: number; warmth: number; blur: number; vignette: number } | null` to the props interface
- Add a `computeCssFilter(f)` helper inside the file that converts the adjustment numbers into a valid CSS filter string:
  ```typescript
  function computeCssFilter(f: BeautyAdjustments): string {
    return [
      `brightness(${100 + f.brightness}%)`,
      `contrast(${100 + f.contrast}%)`,
      `saturate(${100 + f.saturation}%)`,
      f.warmth > 0 ? `sepia(${f.warmth / 2}%)` : `hue-rotate(${f.warmth}deg)`,
      `blur(${f.blur / 10}px)`,
    ].join(' ');
  }
  ```
- Apply the computed filter string to the `<video>` element via inline `style={{ filter: cssFilter }}`. When `beautyFilter` is null, `filter` is `'none'`
- Add a vignette overlay `<div>` (absolute, pointer-events-none) with `background: radial-gradient(...)` whose opacity is driven by `beautyFilter.vignette`. When `beautyFilter` is null or vignette is 0, the div renders with opacity 0 (or is not rendered)
- Add a small "Beauty Active" pill badge in the top-left of the preview (next to the time counter) when `beautyFilter !== null` so users know the filter is live. Clicking it clears the filter (requires passing a `onClearBeautyFilter` callback)

---

## Precise CSS Filter Mapping (matches BeautyFiltersPanel canvas logic exactly)

| Slider | Canvas (existing) | CSS filter (new) |
|---|---|---|
| brightness | `brightness(${100+v}%)` | `brightness(${100+v}%)` — identical |
| contrast | `contrast(${100+v}%)` | `contrast(${100+v}%)` — identical |
| saturation | `saturate(${100+v}%)` | `saturate(${100+v}%)` — identical |
| warmth > 0 | `sepia(${v/2}%)` | `sepia(${v/2}%)` — identical |
| warmth < 0 | `hue-rotate(${v}deg)` | `hue-rotate(${v}deg)` — identical |
| blur | `blur(${v/10}px)` | `blur(${v/10}px)` — identical |
| vignette | radial gradient on canvas | absolute overlay `<div>` with same radial gradient |

The mapping is 1:1 with the existing canvas implementation, so the preview will match the downloaded image exactly.

---

## UX Flow (CapCut-style)

1. User clicks **Beauty** tab in the toolbar
2. The Beauty panel opens below — presets and sliders are shown **immediately** (no upload needed)
3. User clicks **"Warm Glow"** preset → sliders update AND the video in the preview canvas instantly shows the warm glow CSS filter
4. User drags the **Brightness** slider → preview updates in real time (every `onChange` event)
5. A small **"Beauty: ON"** badge appears in the top-left of the preview canvas
6. User clicks **"Add to Timeline"** (new button) → a toast confirms the filter is baked in, or clicking **"Clear"** removes it from the canvas
7. The image download section (upload your own file, download filtered PNG) remains available below the presets/sliders as a secondary "Export frame" feature

---

## Summary of File Changes

| File | Change |
|---|---|
| `BeautyFiltersPanel.tsx` | Add `onFilterChange` prop; call it on every adjustment; show presets/sliders immediately without upload gate; add Clear button |
| `AIVideoStudio.tsx` | Add `activeBeautyFilter` state; wire `onFilterChange` to panel; pass `beautyFilter` to canvas |
| `VideoPreviewCanvas.tsx` | Accept `beautyFilter` prop; apply computed CSS filter to `<video>` style; add vignette overlay div; show "Beauty: ON" badge |
