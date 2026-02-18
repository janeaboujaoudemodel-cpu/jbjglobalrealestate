
# CapCut-Style AI Video Studio Redesign

## What the User Wants

A true CapCut-style layout where:
- The **video preview is large and dominant** in the center
- **All tools appear in a horizontal bottom toolbar** (no hidden side panels needed to discover features)
- Features are **visible upfront** even before any video is uploaded — tools should be browsable immediately
- The left Media Library panel and right Inspector panel are collapsed/merged into the new design

## Current Architecture Problems

The existing layout has these issues:
1. **3-column layout** (left media library + center preview + right inspector) makes the preview small
2. **Tools bar** already exists at the bottom but opens into a `h-64` drawer — correct direction but needs polish
3. **Left panel** takes 18% of screen and is only used for media management — it hides the preview
4. **Right panel** (Inspector) takes 28% — it's mostly empty when no clip is selected
5. **No welcome/onboarding state** — the app shows a grey preview area saying "No media at playhead"

## New Layout Architecture

### Desktop (≥768px) — True CapCut Layout

```text
┌────────────────────────────────────────────────────────────┐
│  TopBar: Logo | Project Name | Undo/Redo | Save | Export   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│         ┌──────────────────────────────────────┐          │
│         │                                      │          │
│         │        VIDEO PREVIEW (large)         │          │
│         │        with caption overlay          │          │
│         │                                      │          │
│         │   ▶ Play  ⏹ Stop  ⏭ Skip  🔊 Vol   │          │
│         └──────────────────────────────────────┘          │
│                                                            │
│  [Captions] [Voice] [Beauty] [Sound FX] [Resize]          │
│  [Effects]  [Text]  [AI Edit] [Map]     [Projects]         │
│  ════════════════════════════════════════════════           │
│  ┌─ Active Tool Panel (collapsible h-56) ──────────────┐   │
│  │  CaptionTranslator / VoiceoverRecorder / etc.       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  Timeline (h-40) ─ tracks + clips + playhead              │
├────────────────────────────────────────────────────────────┤
│  Export Bar: presets + Download + ZIP                      │
└────────────────────────────────────────────────────────────┘
```

The key change: **remove the fixed left/right panels from the main viewport**. Instead, **Media Library** and **Inspector** become panel options inside the bottom tools bar (as "Media" and "Inspector" tool tabs). This frees up ~46% of horizontal space for the preview.

### What happens to left/right panels

- **Media Library** → becomes a tool tab "Media" in the bottom toolbar (replaces "Projects")
- **Inspector** → becomes a tool tab "Inspector" in the bottom toolbar
- The `ResizablePanelGroup` with 3 columns is replaced by a single full-width preview column

### Welcome / Empty State (before upload)

When no media is in the timeline, the preview area shows a rich welcome screen instead of "No media at playhead":

```text
┌──────────────────────────────────────────────────────────┐
│                                                          │
│           🎬  JBJ AI Video Studio                        │
│                                                          │
│     ┌──────────────┐    ┌──────────────┐                 │
│     │  📁 Upload   │    │  🎵 Audio    │                 │
│     │   Video      │    │  Only        │                 │
│     └──────────────┘    └──────────────┘                 │
│                                                          │
│     ┌──────────────┐    ┌──────────────┐                 │
│     │  📝 Start    │    │  🤖 AI       │                 │
│     │  Captions    │    │  Generate    │                 │
│     └──────────────┘    └──────────────┘                 │
│                                                          │
│     Drop a video here or click to upload                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

This satisfies "show all features upfront before any upload" — clicking "Start Captions" opens the Captions tool panel, clicking "AI Generate" opens the AI Editor, etc.

## Files Changed

Only **two files** need to change:

### 1. `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx`

This is the main restructuring file. Changes:

**a) Remove the 3-column ResizablePanelGroup** — replace with a single full-width center column for the preview.

**b) Add "Media" and "Inspector" to TOOL_TABS** so the left/right panel content is accessible:

```typescript
const TOOL_TABS = [
  { id: 'media',      label: 'Media',      icon: FolderOpen },
  { id: 'captions',  label: 'Captions',   icon: Languages  },
  { id: 'voice',     label: 'Voice',      icon: Mic        },
  { id: 'beauty',    label: 'Beauty',     icon: Sparkles   },
  { id: 'text',      label: 'Text',       icon: Type       },
  { id: 'sfx',       label: 'Sound FX',   icon: Music2     },
  { id: 'effects',   label: 'Effects',    icon: Layers     },
  { id: 'resize',    label: 'Resize',     icon: Maximize2  },
  { id: 'map',       label: 'Map',        icon: Map        },
  { id: 'ai-editor', label: 'AI Editor',  icon: Bot        },
  { id: 'inspector', label: 'Inspector',  icon: Settings2  },
  { id: 'projects',  label: 'Projects',   icon: FolderOpen },
];
```

**c) Tool panel expanded to `h-72`** (from `h-64`) to give panels like CaptionTranslator more room.

**d) New welcome/empty-state card** rendered inside the center panel area when no props signal an active clip — passed in as a new `hasMedia` boolean prop, or just rendered inside `VideoPreviewCanvas`.

**e) Full-width desktop layout:**

```tsx
// Before: ResizablePanelGroup with 3 panels
// After:
<div className="flex-1 min-h-0 w-full">
  {centerPanel}
</div>
```

**f) Mobile layout** — stays similar but also uses the tools bar approach.

### 2. `src/components/ai-video-studio/AIVideoStudio.tsx`

**a) Add `leftPanel` and `rightPanel` as tool tab content** — pass the `MediaLibraryPanel` as `mediaPanel` prop and `InspectorPanel` as `inspectorPanel` prop to the layout.

**b) Remove old `leftPanel` and `rightPanel` props** from the layout call (they no longer exist as side columns).

**c) Add welcome state detection** — pass `hasMedia={project.tracks.some(t => t.clips.length > 0)}` to enable the empty state.

**d) Update layout props** to add `mediaPanel` and `inspectorPanel`:

```tsx
<AIVideoStudioLayout
  topBar={...}
  centerPanel={<VideoPreviewCanvas ... />}
  timeline={...}
  exportBar={...}
  mediaPanel={<MediaLibraryPanel ... />}         // ← was leftPanel
  inspectorPanel={<InspectorPanel ... />}         // ← was rightPanel
  captionsPanel={...}
  voicePanel={...}
  ...
/>
```

## Interface Prop Changes

The `AIVideoStudioLayoutProps` interface will change:

```typescript
// Remove:
leftPanel: ReactNode;
rightPanel: ReactNode;

// Add:
mediaPanel?: ReactNode;       // Media Library (now in tool tabs)
inspectorPanel?: ReactNode;   // Inspector (now in tool tabs)
hasMedia?: boolean;           // Controls empty state in preview
```

## Empty State Design in VideoPreviewCanvas

When `clips` is empty (no media in timeline), instead of the grey "No media at playhead" text, show a proper upload/quick-start card with:
- Drag-and-drop zone (file input)
- 4 quick-action tiles: Upload Video, Audio Only, Start Captions, AI Editor
- Subtle animated border
- "or drop a file here" helper text

Since `VideoPreviewCanvas` doesn't have access to the upload function, this is better handled in `AIVideoStudioLayout` — the welcome card is rendered inside the center slot **only when `hasMedia === false`**, overlapping or replacing the preview. The preview canvas stays mounted so clips added via tool panels appear immediately.

Actually, the cleanest approach: the `centerPanel` prop remains `VideoPreviewCanvas` always. The welcome overlay is a `position: absolute` layer inside `VideoPreviewCanvas` itself, triggered when `clips.length === 0`. The `VideoPreviewCanvas` already has a ref to the container div, so it can render an overlay with a file input trigger — and call `onUpload` via a new prop.

So `VideoPreviewCanvas` gets one new optional prop:
```typescript
onUpload?: (files: FileList) => void;
onOpenTool?: (toolId: string) => void;  // to open tool panels from welcome screen
```

## Summary of All Changes

| File | Change |
|---|---|
| `AIVideoStudioLayout.tsx` | Remove 3-column ResizablePanelGroup; full-width preview; add Media + Inspector tool tabs; larger tool panel height |
| `AIVideoStudio.tsx` | Remove leftPanel/rightPanel as side columns; pass as mediaPanel/inspectorPanel; add hasMedia + onUpload to preview |
| `VideoPreviewCanvas.tsx` | Add welcome overlay when clips=[] with upload zone + quick-action tiles; add onUpload + onOpenTool props |

No new files, no database changes, no edge functions needed.

## Technical Notes

- The `ResizablePanelGroup` import stays in the file but is no longer used in the main layout — it can be cleaned up
- `useIsMobile` check remains — mobile layout already works well with the tools bar approach
- Tool panel height increased from `h-64` to `h-72` (288px) to give the Media panel (which has tabs + search + grid) enough room
- The Media tab in the tools bar shows the full `MediaLibraryPanel` — upload, stock, AI, templates — all accessible
- The Inspector tab shows clip properties when a clip is selected, or "Select a clip" empty state
- `TOOL_TABS` gains "Media" (first) and "Inspector" (second-to-last) entries; "Projects" stays last
