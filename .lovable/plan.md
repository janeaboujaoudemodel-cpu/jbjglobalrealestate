
# Fix: AI Video Studio - 7 Issues

## Root Cause Analysis (From Code Inspection + Screenshots)

### Issue 1: Preview Disappears When Tools Open (CRITICAL)
The layout in `AIVideoStudioLayout.tsx` uses `h-full flex flex-col`. When the tool panel (`h-72`) opens, it takes 288px from the flex column. Combined with the top bar (~48px), tool tabs bar (~44px), and timeline (192px), the total = ~572px. On a viewport of ~580px below the header (720px total - 64px header - 64px studio top bar = ~592px visible), the preview gets squashed to nearly 0px.

**Fix**: Make the tool panel a fixed-height `overflow-hidden` section at the bottom, and give the preview a `flex-1 min-h-0` that NEVER drops below a minimum height. Reduce tool panel height from `h-72` (288px) to `h-56` (224px) and add a `min-h-0` chain throughout.

Additionally, the current setup shows the tool panel BETWEEN the preview and timeline. This is correct for CapCut-style, but the preview must have a `min-h` so it never collapses. Setting `min-h-32` on the preview wrapper will stop it from collapsing.

### Issue 2: Stock Music Tab - Broken/Invisible Cards
The `AssetCard` in `MediaLibraryPanel.tsx` renders invisible cards because the `stockAssets` are loaded from the database but they have no `thumbnailUrl`, and the icon rendering falls into the `default` case. But more critically — the `Button` components in the stock categories filter use `variant="ghost"` for inactive state, which makes them invisible text on dark background (no border visible). The card grid is dark on dark.

**Fix**: 
- Add a visible fallback icon background to `AssetCard` for stock audio items
- Add `border border-slate-700` to the ghost variant category buttons 
- Add `text-white` to ensure text is always visible on `AssetCard`

### Issue 3: Generate Scene - Shows "Coming Soon" Toast
In `MediaLibraryPanel.tsx` line 248, the `Generate Scene` button calls `toast.info('AI Scene Generator coming soon!...')`. The user wants this to actually open an AI scene generation workflow.

**Fix**: Replace the coming-soon toast with a real AI scene generation form — a text prompt input + a generate button that calls a real endpoint. Since we have `google/gemini-3-pro-image-preview` available for image generation, we can generate AI images from prompts and add them to the media library. This removes the "coming soon" label entirely.

### Issue 4: Beauty Filters - Image Only, Not Video
`BeautyFiltersPanel.tsx` explicitly says "Apply professional filters to images" and only accepts `image/*` files. The canvas-based filter engine only works with `<img>` elements.

**Fix**: 
- Change the description to "Apply professional filters to images & video frames"
- Accept `video/*` and `image/*` in the file input
- For video files, extract a frame using a `<video>` element + canvas, apply the filter preset, and allow download of the filtered frame
- Keep the canvas-based workflow but add video frame extraction

### Issue 5: Text Preset Buttons Not Clickable
Looking at the code in `TextOverlayPanel.tsx` lines 130-139, the preset buttons DO call `applyPreset(p)`. The buttons use:
```tsx
<button key={p.label} onClick={() => applyPreset(p)} className="px-2.5 py-1 text-xs rounded-md border border-slate-600 bg-slate-800 hover:border-amber-500/60 hover:bg-slate-700 transition-all">
```
The issue is that this panel is inside a `ScrollArea` inside a `h-72 overflow-hidden` container. The `ScrollArea` may be clipping the events, OR the `h-full` `ScrollArea` is not getting proper height.

**Fix**: The TextOverlayPanel wraps in `<ScrollArea className="h-full">`. When inside `h-72 overflow-hidden` in the layout, this should work. But the real issue is that when you click on these presets, they call `applyPreset` which only updates the form state — they do NOT immediately add a clip. Users expect clicking "Clean Title" to add it to the preview. 

**Fix**: Make each preset button also trigger `onAddTextClip` immediately (like "one-click add") OR add a clear visual indicator + an "Add to Canvas" button. Update the UX to show a preview of each preset and make the "Add to Canvas" button more prominent.

### Issue 6: Sound Effects Not Playing + Waveform Missing
The SFX panel code looks correct for generation. The issue is:
1. Generated sounds show as "selected" (toast shows) but the preset buttons in `SoundEffectsPanel.tsx` call `handleGenerate(p.text)` which GENERATES a new sound — it doesn't immediately play a demo. Users click and expect instant playback, but actually they need to WAIT for ElevenLabs to generate it.
2. There's no waveform/progress indicator visible while playing.
3. No visual waveform display for generated sounds.

**Fix**: 
- Add a loading spinner on each preset button while generating
- Add an audio progress bar showing playback position (using `<audio>` `timeupdate` event)
- Show clearer "Generating..." state feedback per-button
- Expand the preset categories with more sound options (more variety in each)

### Issue 7: Scroll Gets Stuck
The scroll-stuck behavior is caused by the `overflow-hidden` on the outer layout containers. When the tool panel opens, the entire studio layout is `overflow-hidden`, which traps scroll events. The `ScrollArea` from Radix UI uses a custom scrollbar, and when a user scrolls to the bottom of a tool panel, the outer container captures further scroll events.

**Fix**: Ensure all tool panel content uses `ScrollArea` from Radix correctly, and add `overscroll-contain` to the tool panel div to prevent scroll-chaining.

---

## Files to Change

### 1. `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx`
- Add `min-h-24` to the preview wrapper so it never fully collapses
- Change tool panel from `h-72` to `h-64` (still large enough but less aggressive)
- Add `overscroll-contain` to the tool panel inner div to stop scroll bleed
- Move the tool panel inside a `flex-shrink-0` wrapper with explicit height

### 2. `src/components/ai-video-studio/panels/MediaLibraryPanel.tsx`
- **Stock tab**: Fix category filter buttons — change from `variant="ghost"` to explicit `bg-slate-800 border border-slate-700` styling so they're visible
- **AssetCard**: Fix the card layout — add `bg-slate-800` and proper text contrast to card content area; make the music icon card show a colored background instead of being invisible
- **AI tab - Generate Scene**: Replace `toast.info('coming soon...')` with an actual AI image generation flow — show a prompt input + Generate button that uses `google/gemini-3-pro-image-preview` model to create images that get added to the media library

### 3. `src/components/ai-video-studio/features/BeautyFiltersPanel.tsx`
- Change header text from "Apply professional filters to images" to "Apply professional filters to images & video"
- Change file input `accept` from `image/*` to `video/*,image/*`
- Handle video files: extract first frame using `<video>` + canvas, then apply filters
- Update the drop zone label from "Drop image here" to "Drop image or video here"
- Update supported formats to include MP4, MOV, WebM

### 4. `src/components/ai-video-studio/features/TextOverlayPanel.tsx`
- Make preset buttons call BOTH `applyPreset(p)` AND immediately `handleAdd()` so one click = add to canvas
- Add visual thumbnails/previews to each preset card (small canvas previews)
- Make the preset area a grid with visible preview thumbnails instead of just text buttons
- Show a brief flash/confirmation when a preset is added

### 5. `src/components/ai-video-studio/features/SoundEffectsPanel.tsx`
- Add per-button `isThisGenerating` spinner (already exists — just ensure it's styled correctly)
- Add an `<audio>` progress bar for currently playing sounds using `useRef` + `onTimeUpdate`
- Add more sound categories: "🏡 Outdoor/Pool", "🎹 Music Stings" with more prompts
- Show a visible waveform-style animation (CSS bars) while a sound is playing

### 6. `src/pages/toolkit/AIVideoStudioPage.tsx`
- The current height `calc(100vh - 64px)` only accounts for a 64px header. The actual header varies. Verify this works with the actual main layout's padding-top by checking the MainLayout component.

## Key Technical Detail: Preview Stability

The CapCut approach the user wants is:
```
┌──────────────────────────────────┐  ← Top Bar (fixed height)
│                                  │
│       VIDEO PREVIEW              │  ← flex-1 min-h-[200px] (never collapses)
│                                  │
├──────────────────────────────────┤
│ Media | Captions | Beauty | ...  │  ← Tool tab bar (fixed height ~44px)
├──────────────────────────────────┤
│                                  │
│       ACTIVE TOOL PANEL          │  ← h-64 (fixed height, flex-shrink-0)
│                                  │
├──────────────────────────────────┤
│          TIMELINE                │  ← h-48 (fixed height)
├──────────────────────────────────┤
│          EXPORT BAR              │  ← fixed height
└──────────────────────────────────┘
```

Adding `min-h-[180px]` to the preview wrapper guarantees the preview always stays visible regardless of what panels are open.
