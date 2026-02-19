
# Preview Canvas Rebuild — Aspect Ratio Switching + Click-to-Inspect

## Current State Analysis

### Preview Canvas (`VideoPreviewCanvas.tsx`)
- The preview area is `<div className="flex-1 min-h-0 relative overflow-hidden bg-black">` — it takes all available vertical space in the layout, but it has **no aspect ratio constraint**. The media inside uses `object-contain` which adds black bars but the outer shell stretches arbitrarily.
- There is **no aspect ratio switcher UI** of any kind. The preview always fills the container's shape.
- The layout in `AIVideoStudioLayout.tsx` gives the preview a collapsed height of 180px when a tool panel is open, and `minHeight: 280` when no tool is open — both are too small for meaningful editing.

### Timeline → Inspector Wiring (`AIVideoStudio.tsx`)
- `onSelectClip` is called by `TimelineEditor` when a clip is clicked.
- `selectClip` is from `useVideoStudioProject` and stores `selectedClipIds` in `timelineState`.
- `selectedClip` is derived in `AIVideoStudio.tsx` as `getSelectedClips()[0]` and passed to `<InspectorPanel>`.
- **The Inspector is never auto-opened.** It lives inside `AIVideoStudioLayout`'s tool panel behind the "Inspector" tab. Clicking a timeline clip updates `selectedClip` state, but the user still has to manually click the Inspector tab to see it.
- The fix requires: when `selectClip` is called via a timeline clip click, also call `layoutRef.current?.toggleTool('inspector')` to switch the active panel to Inspector automatically.

---

## Changes Required

### 1. `VideoPreviewCanvas.tsx` — Aspect Ratio Switcher + Constrained Canvas

**Add to props:**
```typescript
aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5';
onAspectRatioChange?: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
```

**What changes inside the component:**

**A. Aspect ratio pill selector** — a small 3-button pill row pinned to the top of the preview area:
- `16:9` (YouTube)
- `9:16` (Reels)
- `1:1` (Instagram)

These are always visible, styled as compact amber-outlined chip buttons. Active one is amber-filled. Clicking changes `aspectRatio` state.

**B. The canvas frame** — instead of `absolute inset-0`, the visible video frame becomes a **centered box with a fixed aspect ratio**:
- The outer container stays `flex-1 min-h-0 relative overflow-hidden bg-black`.
- Inside, a flex-centered wrapper renders the canvas box:
  ```
  <div className="absolute inset-0 flex items-center justify-center bg-black">
    <div style={{ aspectRatio: cssRatio, maxHeight: '100%', maxWidth: '100%', position: 'relative', width: X, height: Y }}>
      ... media, overlays, transitions all go here ...
    </div>
  </div>
  ```
- The canvas width/height is computed from the container's actual dimensions to always fill as much of the preview area as possible while maintaining the exact aspect ratio.
- `16:9` → `aspectRatio: '16/9'`, `9:16` → `aspectRatio: '9/16'`, `1:1` → `aspectRatio: '1/1'`

**C. Thin letterbox bars** — the black area outside the canvas gets a subtle checkerboard pattern (CSS `background-image`) to visually indicate it's outside the canvas frame, similar to how DaVinci Resolve and CapCut show the safe area.

**D. Canvas size badge** — a tiny bottom-left badge showing the format name: `📱 Reels 9:16`, `▶️ YouTube 16:9`, `⬜ Square 1:1` — appears for 2 seconds after switching then fades.

### 2. `AIVideoStudioLayout.tsx` — Expose `setActiveTool` Imperatively

The `AIVideoStudioLayoutHandle` already exposes `toggleTool(toolId)`. This is exactly what's needed. No new methods needed.

**However**, `toggleTool` currently toggles: if the tool is already active, it collapses/expands. When auto-opening Inspector, we need to **always open** (not toggle). Add a second method to the handle:

```typescript
export interface AIVideoStudioLayoutHandle {
  toggleTool: (toolId: string) => void;
  openTool: (toolId: string) => void;  // NEW — always opens, never collapses
}
```

`openTool` implementation:
```typescript
openTool(toolId: string) {
  setActiveTool(toolId);
  setToolsExpanded(true);
}
```

### 3. `AIVideoStudio.tsx` — Wire Timeline Click → Auto-open Inspector

Current `handleClipMouseDown` in `TimelineEditor` calls `onSelectClip(clip.id)` → goes to `selectClip` in `useVideoStudioProject`.

The fix is to wrap `selectClip` in `AIVideoStudio.tsx` with a callback that also opens Inspector:

```typescript
const handleSelectClip = useCallback((clipId: string, multiSelect?: boolean) => {
  selectClip(clipId, multiSelect);
  // Auto-open inspector whenever a clip is selected from the timeline
  if (!multiSelect) {
    layoutRef.current?.openTool('inspector');
  }
}, [selectClip]);
```

Then pass `handleSelectClip` instead of `selectClip` to `<TimelineEditor>`:
```tsx
onSelectClip={handleSelectClip}
```

**And** pass `aspectRatio` state + handler to `VideoPreviewCanvas`:
```tsx
aspectRatio={previewAspectRatio}
onAspectRatioChange={setPreviewAspectRatio}
```

Add state in `AIVideoStudio.tsx`:
```typescript
const [previewAspectRatio, setPreviewAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
```

Also sync aspect ratio with export preset: when user selects "Reels" export preset, the preview should auto-switch to 9:16.

### 4. Preview Canvas Layout — Make It Bigger

Currently in `AIVideoStudioLayout.tsx`:
```tsx
style={{ flex: activeTool && toolsExpanded ? '0 0 auto' : '1 1 auto', minHeight: activeTool && toolsExpanded ? 180 : 280 }}
```

When a tool panel is open, the preview collapses to as little as 180px — too small to see anything properly. Change to:
- With tool open: `minHeight: 240px` (increase from 180)
- Without tool: `minHeight: 320px` (increase from 280)
- The preview div gets `min-h-[240px]` or `min-h-[320px]` depending on tool state

Also make the aspect-ratio-constrained canvas use a `useResizeObserver` (or `ResizeObserver`) on the preview container to always compute correct dimensions.

---

## Files to Edit

| File | Change |
|------|--------|
| `src/components/ai-video-studio/preview/VideoPreviewCanvas.tsx` | Add `aspectRatio` prop, aspect-ratio switcher pills UI, constrained canvas box, letterbox area, format badge |
| `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx` | Add `openTool` to `AIVideoStudioLayoutHandle`, increase min-heights |
| `src/components/ai-video-studio/AIVideoStudio.tsx` | Add `previewAspectRatio` state, `handleSelectClip` wrapper that auto-opens Inspector, pass new props to canvas and timeline |

---

## Detailed UI Design for the Aspect Ratio Switcher

Position: **inside the preview area, top-left corner**, overlaid on the black area (not on the video canvas itself).

```
┌──────────────────────────────────────────────┐
│ [16:9 ▶] [9:16 📱] [1:1 ⬜]         00:02.4 │ ← top bar inside preview
│                                               │
│      ┌────────────────────────┐               │
│      │                        │               │
│      │    VIDEO CANVAS        │               │
│      │    (constrained)       │               │
│      │                        │               │
│      └────────────────────────┘               │
│                                               │
└──────────────────────────────────────────────┘
```

The black outer zone (letterbox) uses a subtle `bg-[#0a0a0f]` with a very faint `bg-[size:16px_16px]` checkerboard grid pattern using CSS `background-image` with SVG data URI, so the canvas boundary is clear.

Switcher pill details:
- Container: `absolute top-2 left-2 flex gap-1 z-30`
- Each button: `px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all`
- Active: `bg-amber-500 text-black border-amber-500`
- Inactive: `bg-black/60 text-slate-300 border-slate-600 hover:border-amber-400`

The format badge (appears on switch):
- `absolute bottom-3 left-1/2 -translate-x-1/2`
- Fades out after 2 seconds using CSS animation or a timeout clearing state

---

## Sync with Export Preset

When `selectedExportPreset` changes in `AIVideoStudio.tsx`, also update `previewAspectRatio`:

```typescript
const PRESET_ASPECT_MAP: Record<string, '16:9' | '9:16' | '1:1'> = {
  reels: '9:16',
  youtube: '16:9',
  instagram: '1:1',
  portrait: '4:5',
};

// In handleSelectPreset:
const handleSelectExportPreset = useCallback((presetId: string) => {
  setSelectedExportPreset(presetId);
  const ratio = PRESET_ASPECT_MAP[presetId];
  if (ratio) setPreviewAspectRatio(ratio);
}, []);
```

Pass `handleSelectExportPreset` to `AIVideoStudioExportBar` instead of `setSelectedExportPreset`.

---

## Summary of User-Visible Result

After this build:
1. The preview canvas shows a **correctly proportioned frame** matching the target format — 9:16 portrait for Reels, 16:9 landscape for YouTube, 1:1 square for Instagram
2. Switching format via the 3 pill buttons at the top-left instantly resizes the canvas
3. Selecting a Reels/YouTube/Instagram export preset also auto-switches the preview aspect ratio
4. Clicking any clip in the timeline **immediately opens the Inspector panel** showing that clip's properties — no more manually hunting for the Inspector tab
5. Multi-select (shift+click) does **not** auto-open the Inspector (intentional — inspector shows only single-clip properties)
