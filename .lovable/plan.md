

# Stamp Content Model + Element Hierarchy — Plan

## Current State

**StampTextEditor.tsx** already groups SVG text elements by `data-stamp-element` IDs (`top-arc`, `bottom-arc`, `loc-top`, `loc-bottom`, `center`, `registration`, `separator-left`, etc.) with labels like "Top Arc (Company Name)". However, these are presented as a flat list inside a single "Company Name Arcs" accordion section — no semantic hierarchy.

**StampLeftPanel.tsx** has "Center Content" with Monogram/Logo/None modes. Logo upload exists but has no background removal. No wordmark vs. characters mode toggle.

## Changes

### 1. Replace "Company Name Arcs" with Element Hierarchy Panel (`StampLeftPanel.tsx`)

Replace the single `text` accordion item with a new `element-hierarchy` section that groups elements into a semantic tree:

```
📋 Element Hierarchy
├── Company Name
│   ├── Arabic Arc (top-arc)
│   └── English Arc (bottom-arc)
├── Location
│   ├── Arabic Arc (loc-top)
│   └── English Arc (loc-bottom)
├── Center Content (existing controls moved inline)
│   ├── Monogram
│   ├── Logo
│   └── License / Registration
├── Separators
│   ├── Left
│   └── Right
```

Each leaf node expands to show the current text + edit button + word/letter drill-down (reusing existing StampTextEditor logic). The tree structure uses nested collapsibles, not the flat segment list.

### 2. Add Wordmark vs. Characters Mode Toggle (`StampTextEditor.tsx`)

Add a toggle at the top of each arc segment's expanded view:

- **Wordmark Mode** (default): Shows the full text as one editable string. Controls: edit text, font, spacing, arc spread.
- **Characters Mode**: Splits text into individual letter cells. Each letter gets: color picker, size nudge, position offset. This uses the existing Level 3 letter grid but makes it the primary view when toggled.

New state: `editMode: Record<string, 'wordmark' | 'characters'>` on the editor.

### 3. Logo Background Removal (`StampLeftPanel.tsx`)

When a logo is uploaded via the Center Content section:

1. Draw the uploaded image to an offscreen `<canvas>`
2. Read pixel data, detect if corners are white/near-white (RGB > 240)
3. If detected, replace white pixels (within threshold) with transparent
4. Convert back to data URL and set as the logo

This runs client-side immediately after `FileReader.onload`. Add a small "Background removed" toast on success, or "Clean background detected" if no removal needed.

### 4. Consolidate Center Content into Hierarchy

Move the existing Center Content controls (Monogram input, MonogramColorEditor, Logo upload, "Apply to Stamps" button) into the hierarchy tree under "Center Content" as expandable sub-nodes. Remove the standalone "Center Content" accordion item to avoid duplication.

Also remove the standalone "Separators" accordion item — separator style grid and position slider move into the hierarchy under "Separators > Left / Right".

## Files Modified

| File | Changes |
|------|---------|
| `StampLeftPanel.tsx` | Replace `text` + `center` + `separators` accordion items with single `element-hierarchy` item containing semantic tree. Add logo background removal on upload. |
| `StampTextEditor.tsx` | Add wordmark/characters mode toggle per segment. Restructure to accept a `hierarchyMode` prop that renders only a specific segment (not all). |

## What Will NOT Change
- StampGeneratorPage state management (just stabilized)
- StampInteractivePreview click-to-edit behavior
- Color controls, spacing controls, My Stamp section
- Right panel (Design Library)
- Database schema

