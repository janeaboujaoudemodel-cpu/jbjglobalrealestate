
# Fix: AI Designer Panel — All Issues

## Issues Identified

### 1. AI Designer Panel — Visibility & Layout
The panel uses `fixed inset-y-0 right-0 w-80` with `z-50`. On desktop it is partially hidden behind the global chat widget (z-[10050]) which sits at `bottom-6 right-4`. The submit/send row at the bottom of the AI Designer (`px-4 py-3 border-t`) is physically covered by the chat icon.

### 2. X (Close) Button — Nearly Invisible
The close icon uses `text-[hsl(var(--muted-foreground))]` with no background, making it extremely hard to see against the header gradient. Needs a visible styled button.

### 3. Quick-suggest Buttons — Only Fill Input, Don't Preview
Clicking "Change to a more minimalist style" only calls `setChatInput(eg)` — it does not submit and does not trigger a preview. Users expect a click to immediately show the result.

### 4. No Live Preview in the AI Designer
After the AI returns a refined SVG, it is just prepended as the first card in the grid (behind the panel). The user has no idea the design changed unless they close the panel.

### 5. No "Save as New" / "Replace" Flow
After a refinement succeeds, there's no choice: it always creates a new card. The user wants:
- **Replace**: overwrite the currently selected concept's SVG
- **Save as New**: add as an additional concept (current behavior)

### 6. Global Chat Widget Blocks the Submit Button
`CollapsedChatButton` is `fixed bottom-6 right-4 z-[10050]`. The AI Designer's send row is also on the right side. The chat icon sits directly over the send button.

### 7. Draggable Chat Widget (User Request)
Users want to move the chat button away from overlapping elements.

---

## The Fix — Changes to Two Files

### File 1: `src/components/stamp-generator/StampGeneratorPage.tsx`

#### A. Redesign the AI Designer Panel
Convert from a full-height `fixed inset-y-0 right-0` side drawer to a **draggable floating panel** that:
- Opens centered/top-right but can be moved
- Has a visible header with clear X button (styled with background + contrast)
- Has a live preview section showing the currently refined design
- Has "Apply as New" and "Replace Selected" action buttons after a refinement is returned
- Auto-scrolls suggestion options rather than truncating

**Quick-suggest buttons**: On click, auto-send the message immediately (call `sendChatMessage` after setting input).

**New state needed:**
```typescript
const [aiPanelPos, setAiPanelPos] = useState({ x: 0, y: 0 }); // drag offset
const [dragging, setDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });
const [refinedPreview, setRefinedPreview] = useState<StampDesignConcept | null>(null);
```

**Panel layout changes:**
- Fixed position: `right-4 top-16` with transform for drag offset
- Header: Gold gradient background, large X button with white background circle
- After AI returns SVG: show a small live preview inside the panel + two buttons ("Replace Selected" / "Save as New")
- Send button positioned above the chat icon zone (add `mb-16` or `pb-20` to the input area)

**Replace logic:**
```typescript
function applyRefinement(mode: 'replace' | 'new') {
  if (!refinedPreview) return;
  if (mode === 'replace' && selectedId) {
    setSvgOverrides(prev => ({ ...prev, [selectedId]: refinedPreview.svgSource }));
    setRefinedPreview(null);
    toast.success('Design updated!');
  } else {
    setConcepts(prev => [refinedPreview, ...prev]);
    setRefinedPreview(null);
    toast.success('New concept added!');
  }
}
```

**Drag support (mouse + touch):**
```typescript
function onDragStart(e: React.MouseEvent) {
  setDragging(true);
  setDragStart({ x: e.clientX, y: e.clientY, px: aiPanelPos.x, py: aiPanelPos.y });
}
// mousemove/touchmove on window: update aiPanelPos
// mouseup/touchend: setDragging(false)
```

#### B. Update `sendChatMessage` return value
Store the returned `StampDesignConcept` in `refinedPreview` state instead of immediately prepending to `concepts`.

---

### File 2: `src/components/chat/CollapsedChatButton.tsx`

#### Make the Chat Button Draggable
Add drag state so users can reposition the button. Use `useRef` + mouse/touch events.

**New state:**
```typescript
const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // null = default position
const [isDragging, setIsDragging] = useState(false);
const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
```

**How it works:**
- Default position unchanged (`fixed bottom-6 right-4` / `left-4`)
- On `mousedown`/`touchstart` on the button: record start
- On `mousemove`/`touchmove`: update `pos` offset
- On `mouseup`/`touchend`: finalize — if drag distance < 5px, treat as click (toggle)
- When `pos` is set, apply `style={{ transform: \`translate(${pos.x}px, ${pos.y}px)\` }}` to override default position

**Smart overlap detection:**
- After drag ends, check if the button overlaps any button/input elements using `document.elementsFromPoint`
- If overlap detected: snap to nearest safe quadrant (bottom-left instead of bottom-right, or nudge up by 70px)
- Show a one-time tooltip: "Drag me to move" on the stamp generator route

---

## Summary of Changes

| File | What Changes |
|---|---|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Redesign AI Designer panel: draggable, visible X, live preview, Replace/Save-as-New buttons, auto-send on suggestion click |
| `src/components/chat/CollapsedChatButton.tsx` | Add drag-to-move support with smart overlap snap logic |

## What Does NOT Change
- The stamp concepts grid, color panel, fonts panel, text editor — untouched
- Export flow — untouched
- All other pages — CollapsedChatButton behavior is identical (drag was never available before, now it is everywhere)
- Backend / edge functions — untouched
