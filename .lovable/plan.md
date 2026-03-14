

## Session 6 — Premium UI/UX Layout for Stamp Generator

### Current State Analysis

The stamp generator already has a 3-column layout (Left: 240px controls, Center: flex-1 preview, Right: 340-400px concepts). However, it needs significant upgrades to feel like a professional branding design tool:

**What exists:**
- 3-panel structure with left controls, center preview, right concepts grid
- Left panel has 6 tabs (Colors, Fonts, Text, Art, Logo, My Stamp)
- Center has live preview with StampInteractivePreview (click-to-edit)
- Right has favorites, concepts grid, recently deleted, version selector modal
- Header with undo/redo, regenerate, variations, export buttons

**What's missing for premium experience:**
- Left panel tabs are flat and cramped — no collapsible sections
- Center preview has no zoom controls, no grid toggle, no alignment guides
- Right panel mixes concepts/favorites/deleted in a single scroll — no organized tabs for Variations/History/Favorites
- No smooth highlight animation when elements change
- No proper version save/restore UI in the right panel (version selector is a modal)
- No project save system with name/version/timestamp
- Performance: no virtualization or lazy rendering for large concept grids

### Implementation Plan

#### 1. Restructure Left Panel — Collapsible Sections (not tabs)

Replace the current 6-tab system with a scrollable panel of **collapsible accordion sections**:

1. **Company Name Arcs** — Arabic/English text editing (currently "Text" tab)
2. **Location Arcs** — Location text controls (part of "Text" tab)  
3. **Separators** — Separator style controls (currently inside StampInteractivePreview toolbar)
4. **Center Content** — Monogram/Logo/None selection (currently "Art" + "Logo" tabs merged)
5. **Circle Structure** — Ring thickness, spacing controls (new)
6. **Font Controls** — Bold/Italic/Size/Family (currently "Fonts" tab)
7. **Colors** — Color wheel, palettes, ink mode (currently "Color" tab)
8. **My Stamp & Signature** — Upload stamp, AI refine, signature overlay (currently "My Stamp" tab)

Each section uses Radix `Collapsible` with smooth accordion animation. Multiple sections can be open simultaneously. Sections remember open/closed state in localStorage.

Width increased from 240px to 280px for better readability.

#### 2. Premium Canvas Preview with Zoom & Grid

Upgrade center panel:

- **Zoom controls**: Slider + buttons (50%–200%) with zoom level display, stored in state
- **Grid toggle**: Optional alignment grid overlay (subtle crosshair/circles)
- **Canvas background**: Checkerboard pattern option for transparency preview, or solid white (toggle)
- **Shadow**: Soft drop shadow behind the stamp on the canvas
- **Safe margin indicators**: Subtle dotted circle showing the stamp boundary zone
- **Stamp size**: Scale the `StampInteractivePreview` size based on zoom level

A small floating toolbar at the bottom of the canvas area with: `[Zoom -] [100%] [Zoom +] | [Grid] | [Background]`

#### 3. Restructure Right Panel — Organized Tabs

Replace the single scrollable area with a tabbed panel:

- **Concepts** tab — Current concepts grid with pagination
- **Favorites** tab — Favorited designs
- **AI Variations** tab — Generated variations (currently an overlay panel)
- **History** tab — Version history and recently deleted (inline, not modal)

Each tab shows its count badge. The AI Variations panel becomes embedded in this tab rather than a full overlay. The Version Selector modal content moves into the History tab as an inline list.

Right panel header includes: `[Regenerate] [AI Variations]` action buttons.

#### 4. Premium Interaction Feedback

- When a color/font/text change is made, the center preview flashes a brief `ring-2 ring-gold/40` pulse animation (200ms)
- Changed SVG elements get a brief golden glow via a CSS transition class
- Color changes animate with `transition-colors duration-200` on the stamp renderer
- Add a subtle "updating..." micro-indicator in the preview header during re-renders

#### 5. Design Version Control (Right Panel — History Tab)

In the History tab:
- **Save Version** button — saves current SVG + settings snapshot to `stamp_designs` with a version label
- **Version list** — shows saved versions with thumbnail, timestamp, label
- **Restore** — loads a version back as the active concept
- **Duplicate** — creates a copy in the concepts list  
- **Rename** — inline edit of version label
- **Recently Deleted** section at the bottom of History tab

#### 6. Project Save System

Add to the header area:
- Project name (editable inline)
- Auto-save indicator ("Saved 2m ago" / "Saving...")
- Manual "Save" button that persists current state to `stamp_projects` table
- Version number display (auto-incremented on save)
- Last modified timestamp

Auto-save: Debounced 3s auto-save of project state (colors, fonts, selected design, overrides) to the database.

#### 7. Performance Optimizations

- Wrap `StampSVGRenderer` in `React.memo` with deep equality check on svgSource + color props
- Use `useMemo` for paginated concepts computation
- Lazy-render concept cards outside viewport using `IntersectionObserver`
- Debounce color wheel changes at 50ms to prevent re-render storms
- `useCallback` for all handler functions passed to child components

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Major restructure — collapsible left panel, tabbed right panel, zoom controls, project save, performance |
| `src/components/stamp-generator/StampCanvasControls.tsx` | NEW — Zoom slider, grid toggle, background toggle floating toolbar |
| `src/components/stamp-generator/StampRightPanel.tsx` | NEW — Tabbed right panel (Concepts/Favorites/Variations/History) |
| `src/components/stamp-generator/StampLeftPanel.tsx` | NEW — Collapsible accordion sections for all tool controls |
| `src/components/stamp-generator/StampProjectHeader.tsx` | NEW — Project name, save status, version display |

### What Will NOT Change

- SVG generation logic (`stampTemplates.ts`, `stampOfficialTemplate.ts`) — untouched
- `StampInteractivePreview` click-to-edit behavior — preserved
- `StampSVGRenderer` core rendering — preserved (only wrapped in memo)
- `StampPreviewModal` — preserved
- Edge functions — no changes
- Database schema — no changes (uses existing `stamp_projects` and `stamp_designs` tables)

