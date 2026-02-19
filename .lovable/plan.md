
# AI Video Studio — Complete UI & UX Fix Plan

## Issues Identified (from user's voice feedback)

### Issue 1: Internal Scroll Trap in Tool Panels
**Root cause:** `AIVideoStudioLayout.tsx` lines 165-171 — the active tool panel has a fixed height (`clamp(260px, 38vh, 480px)`) and wraps content in `overflow-y-auto`. This creates an internal scroll container that intercepts the user's scroll gesture. The user has to scroll INSIDE the little box instead of the main page scrolling naturally.

**Fix:** Remove the internal scroll wrapper and replace the fixed-height box with a natural auto-height panel. The tool panels (VoiceoverRecorder, TextOverlayPanel, etc.) already have their own internal `ScrollArea` in some cases — those need to be removed too. The whole studio layout should become a tall scrollable page on the main window, not a cramped fixed-height box with nested scrollers.

The layout architecture needs to shift from:
```
[Fixed viewport with internal scroll panels]
```
to:
```
[Preview — fixed, never shrinks]
[Tools bar — always visible]
[Active tool panel — natural auto height, expands downward]
[Timeline — fixed height]
[Export bar — fixed]
```

The outer page (`AIVideoStudioPage.tsx`) currently sets `height: calc(100vh - 64px)` and `overflow-hidden` — this is what traps everything. The fix is to allow the studio page to scroll naturally.

### Issue 2: Preview Shrinks When Tool Panel Opens
**Root cause:** `AIVideoStudioLayout.tsx` lines 224-229:
```tsx
style={{ 
  height: activeTool && toolsExpanded ? 200 : undefined, 
  flex: activeTool && toolsExpanded ? '0 0 200px' : '1 1 auto', 
  minHeight: 160 
}}
```
When a tool opens, the preview gets crushed to 200px. This is the opposite of CapCut behavior — in CapCut the preview is ALWAYS fixed-size and tools expand below it.

**Fix:** Preview gets a fixed, non-negotiable height (`flex: 0 0 auto`, e.g., 320px desktop / 240px mobile). Tool panels expand below the preview — they never compete with it. The page scrolls to accommodate.

### Issue 3: Keyboard Shortcuts Not Working Correctly
**Root cause:** The cheat sheet says shortcuts like `V` (Select), `C` (Cut), `H` (Pan), `S` (Snap), `T` (Transitions) exist. Looking at `AIVideoStudio.tsx` lines 97-120, the keyboard handler IS wired. However:

1. `?` key shortcut for the cheat sheet — wired in `AIVideoStudio.tsx`? Let me check — it is NOT wired (the cheat sheet exists as a component but is never mounted/triggered by `?`).
2. The shortcuts fire but inputs hijack them: `if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return` — this check is correct but tool panels contain focusable elements that steal focus.
3. The `T` shortcut toggles Transitions — but the panel opens collapsed/half-visible because of the scroll trap issue.

**Fix:**
- Wire the `?` key to open `ShortcutCheatSheet` (it's defined but never actually connected in the main keyboard handler)
- Ensure `ShortcutCheatSheet` component is mounted in `AIVideoStudio.tsx` with proper state
- Once the scroll trap is fixed (Issue 1), shortcuts that open panels will visibly work

### Issue 4: The Update (History/Projects Panel) Shows Multi-Section Mess
**Root cause:** The user describes clicking something and seeing "multiple things" that should be on the main layout appearing inside the panel instead. The `DetailDrawer` in `VideoAdHistoryPanel.tsx` (lines 158-317) renders as `fixed inset-0 z-50` — a full-screen modal overlay. But since the outer container is itself `overflow-hidden`, the fixed overlay gets clipped to the studio container, not the actual viewport. This makes it look like content is appearing incorrectly "inside" the panel.

Also the `DetailDrawer` opens inside a panel that has a fixed height container with internal scroll — so the drawer's backdrop and content appear mangled.

**Fix:** Ensure the `DetailDrawer` portals to `document.body` (using a React Portal) so it always renders at the true viewport level, regardless of any parent `overflow-hidden` container. Also clean up the multi-section view into a cleaner single-pane design.

### Issue 5: Color Scheme — Still Blue/Yellow, Not Premium
**Root cause:** The entire studio uses `slate-*` (grey-blue) for backgrounds with `amber-500` (yellow/orange) accents. The user has explicitly rejected this multiple times and wants a **dark luxury premium** look.

**Reference from memory:** The Studio uses "Navy-Indigo" (`#0C0E14`, `#131720`, electric indigo-violet `#6366F1`) — but the VIDEO STUDIO was never updated to match. It still uses `slate-800`, `slate-900`, `slate-950`, `amber-500`.

**New palette for Video Studio:**
- **Backgrounds:** `#0A0A0F` (near-black), `#111118` (surface), `#18181F` (cards)  
- **Borders:** `rgba(255,255,255,0.06)` subtle, `rgba(255,255,255,0.12)` active  
- **Accent:** Deep champagne/platinum `#C8A87A` (for active states) — a warm metallic gold, NOT bright amber/yellow  
- **Text:** `#F1F0EE` primary, `#8A8A9A` secondary  
- **Active tool button:** Thin platinum border + subtle champagne glow, no bright orange fill  
- **Timeline:** Near-black `#090910` with platinum track headers  
- **Export bar:** Same near-black with platinum export button  
- **No blue tones.** No `slate-*` classes. No `amber-500` fills.

---

## Files to Change

| File | Changes |
|------|---------|
| `src/pages/toolkit/AIVideoStudioPage.tsx` | Remove `overflow-hidden`, allow natural page scroll |
| `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx` | Fix layout: preview never shrinks, tool panels auto-height, no internal scroll trap. Full luxury color overhaul |
| `src/components/ai-video-studio/layout/AIVideoStudioTopBar.tsx` | Luxury color overhaul — remove slate/amber, apply platinum/dark |
| `src/components/ai-video-studio/layout/AIVideoStudioExportBar.tsx` | Luxury color overhaul |
| `src/components/ai-video-studio/layout/ShortcutCheatSheet.tsx` | Already looks good — no change |
| `src/components/ai-video-studio/AIVideoStudio.tsx` | Wire `?` key to open ShortcutCheatSheet; mount the component |
| `src/components/ai-video-studio/features/VideoAdHistoryPanel.tsx` | Fix `DetailDrawer` to use React Portal; color overhaul |
| `src/components/ai-video-studio/features/TextOverlayPanel.tsx` | Remove internal `ScrollArea` wrapper (let page scroll); luxury colors |
| `src/components/ai-video-studio/features/VoiceoverRecorder.tsx` | Remove internal scroll traps; luxury colors |

---

## Detailed Implementation

### Layout Architecture Change

**Before (broken):**
```
div[h=100vh, overflow-hidden]
  ├── TopBar [fixed height]
  ├── Main [flex-1, overflow-hidden]
  │   ├── Preview [flex: 1→shrinks to 200px when tool opens]
  │   ├── ToolsBar [auto]
  │   │   └── ActiveToolPanel [height: clamp(260px,38vh,480px), overflow-y-auto] ← SCROLL TRAP
  │   └── Timeline [h-44]
  └── ExportBar
```

**After (correct, CapCut-style):**
```
div[min-h=screen, overflow-y-auto] ← main page scrolls
  ├── TopBar [fixed height, position:sticky top-0]
  ├── Preview [fixed 320px height, flex-shrink-0, NEVER changes]
  ├── ToolsBar [sticky, scrollable tabs]
  ├── ActiveToolPanel [auto height, no scroll cap] ← expands naturally
  ├── Timeline [fixed 160px]
  └── ExportBar [fixed, sticky bottom]
```

### Color Token Reference (applied across all files)

```
BG primary:     #0A0A0F
BG surface:     #111118  
BG card:        #18181F
Border subtle:  rgba(255,255,255,0.06)
Border active:  rgba(255,255,255,0.14)
Border accent:  rgba(200,168,122,0.35)  ← champagne
Text primary:   #F1F0EE
Text secondary: #8A8A9A
Accent fill:    #C8A87A  ← champagne/platinum gold
Accent glow:    rgba(200,168,122,0.15)
Active tab bg:  rgba(200,168,122,0.1)
Active tab text:#C8A87A
Button bg:      #1E1E28
Button hover:   #252530
Danger:         #E05252
```

### Shortcut Wiring (AIVideoStudio.tsx)
Add state: `const [showCheatSheet, setShowCheatSheet] = useState(false);`  
Add to keyboard handler: `case '?': setShowCheatSheet(true); break;`  
Mount: `<ShortcutCheatSheet open={showCheatSheet} onClose={() => setShowCheatSheet(false)} />`

### DetailDrawer Portal Fix
Wrap the `DetailDrawer` return in `ReactDOM.createPortal(content, document.body)` to escape the overflow-hidden parent container.

---

## What Does NOT Change
- All data fetching logic, hooks, and backend connections
- ShortcutCheatSheet visual design (already looks great)
- Timeline editor internal logic
- All panel feature functionality (text presets, beauty filters, etc.)
- Export logic and preset handling
