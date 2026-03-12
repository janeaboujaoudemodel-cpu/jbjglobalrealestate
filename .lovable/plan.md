

## Plan: Stamp Generator Full Upgrade — Deploy, Fix, Interactive Edit

### Confirmed Choices
- Deploy scope: All functions
- Live editing: Wizard + Generate Studio
- Default preset: Corporate Official Blue

---

### Phase 1: Deploy All Edge Functions

Deploy `ai-stamp-generator`, `ai-stamp-extract`, and `document-ocr` (plus all others). Update `ai-stamp-extract` to also extract `business_type` from trade licenses. Update `ai-stamp-generator` to use `border_style` in SVG generation.

### Phase 2: Fix Core Bugs

**Border style not reflecting**: Both `stampTemplates.ts` (client) and `ai-stamp-generator` edge function generate SVGs that **ignore** `project.border_style`. Every template uses hardcoded circle strokes. Fix: pass `border_style` into each template and apply correct stroke-dasharray and ring count:
- SINGLE: one solid ring
- DOUBLE: two solid rings
- RING: thick outer + inner ring  
- DOTTED: dotted stroke-dasharray
- ROPE: dashed stroke-dasharray
- CUSTOM: solid outer + dotted inner

The `LiveStampPreview.tsx` already handles border_style correctly — the issue is only in the generated concept templates.

**Typography not reflecting**: The `stampTemplates.ts` hardcodes `fontMap` with only 4 entries (SERIF/SANS/MONOSPACE/CALLIGRAPHY). Add GOTHIC and ARABIC_MODERN entries. The edge function `buildSVG` has the same 4-entry fontMap — expand it.

**"Failed to create project"**: The DB constraint is already expanded (migration ran). The remaining issue is the `as any` cast in the insert. Remove it since the types now include the new columns.

**Low-quality logo**: The `LiveStampPreview` renders logos at `innerRx * 0.6` (≈60px). Increase to `innerRx * 0.85` and use `image-rendering: optimizeQuality`. In the wizard, render at full data URL resolution.

### Phase 3: Interactive On-Canvas Editing (Wizard + Generate)

**Wizard LiveStampPreview**: Add click-to-select layers. When a text arc or monogram is clicked, highlight it and show inline controls (resize slider, delete, move toggle). Use SVG pointer events on each `<text>` and `<image>` element.

Implementation approach:
- Wrap `LiveStampPreview` SVG output in an interactive container
- Create `InteractiveStampCanvas` component that:
  - Renders the SVG with unique IDs per element
  - Overlays transparent hit-target rects on each text/image element
  - On click: selects layer, shows resize handles
  - On drag: moves selected element (updates form state)
  - Resize handles for logo/monogram (updates size in form)
  - Delete button removes layer
  - Lock/unlock toggle per layer
- Add undo/redo history stack (array of form snapshots)
- Add toolbar: undo, redo, reset, save draft

**Generate Studio (StampGeneratorPage)**: The generated SVGs from templates already go through `StampSVGRenderer`. Add the same interactive canvas overlay on the selected concept. Allow clicking text arcs to edit inline, dragging monogram to reposition, resizing logo.

### Phase 4: Remove "AI" from Labels

Scan and replace in:
- `StampProjectsDashboard.tsx`: "AI-generated" → "professionally generated"
- `StampGeneratorPage.tsx`: "AI Designer" button → "Smart Designer", "AI Stamp Designer" → "Stamp Designer"
- `StampLicenseUploader.tsx`: Already uses "Smart Auto-Fill" (done in previous edit)
- `StampGeneratorLanding` (pages/toolkit): Remove "AI" from step descriptions
- Navigation labels: "AI Stamp Generator" → "Stamp Generator" in mega menu, corporate suite, registry

### Phase 5: Corporate Blue Default + Business Type

- Default `primaryColor` to `#1B3A8C` (already done in LiveStampPreview)
- In `StampGeneratorPage`, default palette preset to "Ink Blue (Standard)" 
- Update `ai-stamp-extract` prompt to also extract `business_type` (Real Estate, General Trading, etc.)
- Auto-apply business_type to form when extracted
- Show business type badge on stamp preview

### Files to Modify

| File | Changes |
|---|---|
| `src/lib/stampTemplates.ts` | Add GOTHIC+ARABIC_MODERN to fontMap, pass border_style into each template SVG, increase logo render size |
| `src/components/stamp-generator/LiveStampPreview.tsx` | Add interactive layer selection, drag, resize, delete, lock. Increase logo quality. Add undo/redo. |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Wire interactive canvas, add undo/redo/reset toolbar, remove `as any` cast |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Remove "AI" labels, add interactive editing on selected concept, wire undo/redo |
| `src/components/stamp-generator/StampProjectsDashboard.tsx` | Remove "AI" wording |
| `src/pages/toolkit/StampGeneratorPage.tsx` | Remove "AI" from landing page text |
| `src/components/header/MegaMenuToolkit.tsx` | "AI Stamp Generator" → "Stamp Generator" |
| `src/config/royalToolsRegistry.ts` | Remove "AI" from stamp tool name |
| `supabase/functions/ai-stamp-generator/index.ts` | Expand fontMap, apply border_style in buildSVG, improve bilingual template |
| `supabase/functions/ai-stamp-extract/index.ts` | Add business_type extraction to prompt |

### Technical Details

**Interactive canvas architecture**: Rather than rebuilding SVG rendering, overlay transparent hit-target elements positioned via the same coordinate math as the SVG. Each layer gets a CSS pointer-events overlay. Selected layer gets a dashed highlight border. Drag uses pointer events (same pattern as `CollapsedChatButton.tsx`). Position deltas stored in `layout_json` column.

**Border style in templates**: Each template's `buildSVG` switch case currently hardcodes stroke attributes. Add a `borderAttrs` helper that returns `{ strokeDasharray, outerWidth, innerRing }` based on the border_style value, then apply those to each template's outer/inner rings.

**Undo/redo**: Store form state snapshots in a ref array. Push on each meaningful change (debounced 300ms). Max 50 entries.

**Edge function deployment**: All functions deployed automatically on save. No manual steps needed.

