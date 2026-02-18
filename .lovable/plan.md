
# Transitions Panel — Bottom Toolbar Tab + Drag-and-Drop to Timeline

## What Is Being Built

A new **Transitions** tab added to the bottom tool bar (alongside Media, Captions, Voice, Beauty, etc.) that presents four categories of transition effects — Fade, Dissolve, Slide, and Zoom — as draggable cards. When the user drags a transition card onto the gap between two clips on the timeline (or drops it onto a clip), a `transition` clip is inserted between them at 1-second duration.

---

## Architecture Overview

The work touches 5 existing files and creates 1 new file:

```text
src/components/ai-video-studio/
  features/
    TransitionsPanel.tsx          ← NEW: panel with draggable transition cards
  timeline/
    TimelineEditor.tsx            ← EDIT: accept drop events, render transition clips
  AIVideoStudio.tsx               ← EDIT: wire transitionsPanel prop + addTransition handler
  layout/
    AIVideoStudioLayout.tsx       ← EDIT: add transitionsPanel prop + new TOOL_TABS entry
  types.ts                        ← EDIT: add TransitionDefinition type (already has 'transition' Clip type)
```

No database changes, no edge functions, no new dependencies needed — `transition` is already a valid Clip type in `types.ts` line 35.

---

## File-by-File Changes

### 1. `src/components/ai-video-studio/features/TransitionsPanel.tsx` — New File

A scrollable grid of transition cards. Each card shows:
- An animated CSS preview (CSS keyframes only, no canvas needed)
- The transition name and duration badge
- Drag handle so the card is draggable via HTML5 drag-and-drop

**Transition definitions (4 types, 3 variants each = 12 cards):**

| Category | ID | Duration | Preview |
|---|---|---|---|
| Fade | `fade-black` | 1s | Black fade |
| Fade | `fade-white` | 0.75s | White flash |
| Fade | `fade-blur` | 1s | Blur fade |
| Dissolve | `dissolve` | 1s | Cross dissolve |
| Dissolve | `dissolve-slow` | 1.5s | Slow dissolve |
| Dissolve | `dissolve-fast` | 0.5s | Fast dissolve |
| Slide | `slide-left` | 0.8s | Push left |
| Slide | `slide-right` | 0.8s | Push right |
| Slide | `slide-up` | 0.8s | Push up |
| Zoom | `zoom-in` | 0.75s | Zoom into next |
| Zoom | `zoom-out` | 0.75s | Zoom out |
| Zoom | `zoom-punch` | 0.5s | Quick punch zoom |

**Key behaviours:**
- `dragstart` sets `dataTransfer.setData('transition', JSON.stringify({ id, name, duration }))` so the timeline drop zone can receive it
- Cards are arranged in a 3-column CSS grid with category section headings
- A duration slider per card lets the user adjust 0.25s–3s before dragging

**Panel layout:**
```text
┌─────────────────────────────────────────┐
│ 🎬 Transitions                          │
│ Drag onto timeline between clips        │
├──────────────┬──────────────┬───────────┤
│  FADE                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ ░░░░▓▓▓▓│ │ ▓▓▓░░░░░│ │ ░blur░░░│ │
│ │ Fade ●  │ │ White ●  │ │ Blur ●  │ │
│ │ 1.0s    │ │ 0.75s   │ │ 1.0s   │ │
│ └──────────┘ └──────────┘ └──────────┘ │
│  DISSOLVE                               │
│ ... etc ...                             │
│  SLIDE                                  │
│ ... etc ...                             │
│  ZOOM                                   │
│ ... etc ...                             │
└─────────────────────────────────────────┘
```

---

### 2. `src/components/ai-video-studio/timeline/TimelineEditor.tsx` — Edit

Three additions:

**A. Gap drop zones between clips**

After rendering each clip block inside a track row, calculate the gaps between consecutive clips and render an invisible `<div>` drop zone in each gap:

```typescript
// Between clip[i].endTime and clip[i+1].startTime:
<div
  className="absolute top-0 h-full z-30"
  style={{ left: gapStart * pps, width: gapWidth * pps, minWidth: 8 }}
  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
  onDrop={(e) => handleTransitionDrop(e, track.id, insertTime)}
/>
```

Highlight the drop zone with a purple glow while `dragover` is active.

**B. `handleTransitionDrop` callback**

```typescript
const handleTransitionDrop = (e: DragEvent, trackId: string, insertAtTime: number) => {
  const data = JSON.parse(e.dataTransfer.getData('transition'));
  onAddTransition(trackId, insertAtTime, data);
};
```

**C. Transition clip rendering**

Transition clips (where `clip.type === 'transition'`) render differently from normal clips — they show as a diamond/chevron shape in **purple** (`bg-purple-500/80`) with the transition name, visually distinct from video/audio clips:

```text
Timeline track row:
[VIDEO CLIP A ────────▶] [◇ Fade ◇] [◀──────── VIDEO CLIP B]
```

**D. Prop extension**

Add `onAddTransition` to `TimelineEditorProps`:
```typescript
onAddTransition: (trackId: string, time: number, transition: { id: string; name: string; duration: number }) => void;
```

---

### 3. `src/components/ai-video-studio/AIVideoStudio.tsx` — Edit

**A. `handleAddTransition` function** — constructs a full `Clip` object with `type: 'transition'` and calls `addClip`:

```typescript
const handleAddTransition = useCallback((trackId: string, time: number, def: { id: string; name: string; duration: number }) => {
  addClip(trackId, {
    trackId,
    type: 'transition',
    name: def.name,
    startTime: time,
    duration: def.duration,
    source: { url: '', inPoint: 0, outPoint: def.duration, originalDuration: def.duration },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    keyframes: [],
    effects: [{ id: crypto.randomUUID(), type: 'transition', name: def.id, settings: { transitionId: def.id } }],
  });
  toast.success(`✨ "${def.name}" transition added`);
}, [addClip]);
```

**B. Pass `transitionsPanel` prop and `onAddTransition` to layout/timeline.**

---

### 4. `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx` — Edit

Two small changes:

**A. Add entry to `TOOL_TABS` array** (after `effects`, before `resize`):

```typescript
{ id: 'transitions', label: 'Transitions', icon: Clapperboard }
```

Using the `Clapperboard` icon from lucide-react (already available via the installed `lucide-react ^0.462.0`).

**B. Add `transitionsPanel?: ReactNode` to the props interface and map it in `toolPanelContent`.**

---

### 5. `src/components/ai-video-studio/types.ts` — Minor edit

Add a `TransitionDefinition` interface for type safety:

```typescript
export interface TransitionDefinition {
  id: string;
  name: string;
  category: 'fade' | 'dissolve' | 'slide' | 'zoom';
  duration: number;
  description: string;
}
```

The `Clip` type already has `type: 'transition'` at line 35 and `ClipEffect` already has `type: 'transition'` at line 75 — no breaking changes.

---

## Visual Design of Transition Cards

Each card uses a CSS animation (via Tailwind's `animate-*` or inline style keyframes) to give a live mini-preview:

- **Fade**: A div that pulses from dark to light repeatedly
- **Dissolve**: Two half-width divs that crossfade with `opacity` animation
- **Slide**: A div that slides left/right on hover
- **Zoom**: A div that scales up on hover

Cards use the existing amber/gold accent palette for the active/hover state and a purple badge for the "transition" category distinction (matching how transition clips will render on the timeline).

---

## Drag-and-Drop Flow (End-to-End)

```text
User drags transition card
        │
        ▼
dragstart → setData('transition', JSON)
        │
        ▼
User hovers over gap between clips on timeline
        │
        ▼
dragover → e.preventDefault() + gap highlight (purple glow)
        │
        ▼
User drops onto gap
        │
        ▼
drop → handleTransitionDrop → onAddTransition(trackId, time, def)
        │
        ▼
addClip() → new Clip{type:'transition'} inserted at that time
        │
        ▼
Timeline re-renders with purple diamond clip between segments
        │
        ▼
toast.success("✨ Fade transition added")
```

---

## Implementation Order

1. Add `TransitionDefinition` type to `types.ts`
2. Create `TransitionsPanel.tsx` with all 12 draggable cards
3. Edit `TimelineEditor.tsx` to add gap drop zones + transition clip rendering + `onAddTransition` prop
4. Edit `AIVideoStudio.tsx` to add `handleAddTransition` handler and wire up props
5. Edit `AIVideoStudioLayout.tsx` to register the new "Transitions" tab

---

## No Database or Edge Function Changes Required

Transitions are stored as `Clip` objects in the existing in-memory project state (and persisted to `video_studio_projects` table via the existing `useVideoStudioProject` hook). The existing schema supports all needed fields.
