

# Stamp Studio Foundation Reset — Implementation Plan

## Current State Analysis

After reviewing all core files (StampGeneratorPage.tsx: 1229 lines, StampLeftPanel.tsx: 828 lines, StampRightPanel.tsx: 659 lines, StampInteractivePreview.tsx: 599 lines), here is what exists and what needs fixing:

**What works:** The 3-column layout (Left Controls, Center Preview, Right Library) is structurally correct. The standard model concept is implemented. The interactive preview has click-to-edit. Colors, fonts, and spacing controls exist.

**What is broken/confusing:**

1. **"Project created!" toast fires during wizard→editor transition** (StampProjectWizard.tsx line 385), then immediately navigates with `?fresh=1` which triggers `generateConcepts()` — user sees "Project created!" while generation is still running.

2. **Generation state is split** between `generating` (center spinner) and `generatingInPanel` (right panel loading) — the center shows a spinner ONLY on first gen, but the right panel shows loading skeletons separately. These two states get out of sync.

3. **Default accordion state opens `['colors', 'text']`** (StampLeftPanel line 179) — "Company Name Arcs" (text) opens immediately and dumps all text items. Colors also opens by default. This is noisy.

4. **Standard model can disappear** if `standardConcept` is null and generation fails or returns empty — the center shows "Select a design to preview" placeholder.

5. **The `loadProject` function** (line 371) mixes concerns: project loading, design loading, standard model initialization, and auto-generation all in one async function with no clear state machine.

---

## Implementation Plan

### TASK 1 & 2: Unified State + Standard Model as Single Source of Truth

**File: `StampGeneratorPage.tsx`**

- **Consolidate generation state**: Remove `generatingInPanel` — use a single `generating` boolean. The center preview always shows the standard model (never a spinner after first load). The right panel shows skeleton cards while generating.
- **Protect standard model**: After first generation sets `standardConcept`, it is never cleared. `generateConcepts()` only updates the `concepts` array (alternatives). The standard model is only changed via explicit `handleSelectConcept()`.
- **Separate `loadProject` into two phases**:
  1. `loadProject()` — loads project data + persisted designs from DB, sets standard from `selected_design_id`
  2. `generateConcepts()` — only called when explicitly needed (fresh project or user clicks Regenerate)
- Guard: if `standardConcept` exists, never show the center spinner.

### TASK 3: Remove Broken Intermediate States

**File: `StampProjectWizard.tsx`**

- Change the flow: after DB insert succeeds, navigate immediately to `/generate?fresh=1` — remove `toast.success('Project created!')` (or change to a subtle non-blocking indicator). The generation screen handles its own loading state.

**File: `StampGeneratorPage.tsx`**

- On `?fresh=1`: show a clean "Generating your stamp concepts..." state in the RIGHT PANEL only (skeleton cards). The center shows a static placeholder stamp outline (not a spinner).
- After generation completes, auto-select T0 as standard. No toast. No reload.
- Remove any `navigate()` calls that fire during generation.

### TASK 4: Information Architecture Enforcement

The layout is already structured correctly:
- LEFT: StampLeftPanel (Tool Controls) — 280px
- CENTER: Interactive Preview — flex-1
- RIGHT: StampRightPanel (Design Library) — 340-400px
- TOP: StampProjectHeader

No structural changes needed. The fix is behavioral (Tasks 1-3 above).

### TASK 5: Collapsed/Expanded Control Defaults

**File: `StampLeftPanel.tsx`**

- Change default `openSections` from `['colors', 'text']` to `[]` (all collapsed)
- The "Company Name Arcs" section currently opens the `StampTextEditor` which lists all text nodes — this stays collapsed until user expands it
- Event-driven expansion (click on preview element) remains — only the clicked section opens
- Add a subtle "expand all" / "collapse all" toggle button in the Tool Controls header

---

## Files Modified

| File | Change |
|------|--------|
| `StampGeneratorPage.tsx` | Consolidate generation state, protect standard model, separate load/generate, remove center spinner after first load |
| `StampLeftPanel.tsx` | Default all sections collapsed, add collapse-all toggle |
| `StampProjectWizard.tsx` | Remove "Project created!" toast, navigate silently |

## What Will NOT Change

- StampRightPanel structure (already correct with tabs: Concepts, Favorites, Variations, Library, History)
- StampInteractivePreview (click-to-edit working correctly)
- StampProjectHeader (already correct)
- Color, font, spacing control logic (working correctly)
- Save/Export flow (working correctly)
- Database schema (no changes needed)

