
# Stamp Generator — 6-Issue Fix Plan

## Issues Identified from User Feedback + Code Review

---

### Issue 1 — Logo uploads appear tiny with no resize control (Critical UX)

**Root cause in `stampTemplates.ts` T12:** The uploaded logo in the T12 "Bilingual Logo Center" template uses a hardcoded `logoSize = 64` (diameter). This value does NOT respond to any user slider. The `logoScale` state in `StampPreviewModal.tsx` only scales the entire preview `div` via CSS `transform: scale()` — it affects the rendered preview, NOT the SVG itself. The logo in the stamp SVG stays at 64px regardless.

**Fix:** 
- In `StampPreviewModal.tsx`, pass the `logoScale` into `StampSVGRenderer` as a new `logoSizeOverride` prop
- In `StampSVGRenderer.tsx`, apply this as a regex replacement on the `<image>` element's `width`/`height` attributes and the framing `<circle r="...">` 
- Alternatively (simpler): Apply `transform: scale(logoScale)` only to the **stamp SVG itself** and use `overflow: visible` so it scales within the frame without clipping
- After selecting a stamp (Preview modal), show a clear "Logo Size" slider immediately visible below the stamp preview — and sync it to affect the SVG's logo size directly

---

### Issue 2 — "Edit" button on concept cards doesn't open the preview (Critical UX)

**Root cause in `handleEditText` (StampGeneratorPage.tsx line 255–262):**
```typescript
function handleEditText(concept: StampDesignConcept) {
  setSelectedId(concept.id);
  setPreviewConcept(null);  // ← closes or never opens the preview modal!
  setLeftTab('text');       // ← switches left panel tab (off-screen on mobile)
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast.info('Text editor opened in left panel ← Edit text elements there');
}
```
This intentionally **skips** the preview modal and instead switches the left panel to "Text" tab — but the left panel is only visible on `lg:` screens. On all screens, clicking "Edit" does effectively nothing visible. The user has to know to look at the left panel.

**Fix:** `handleEditText` should:
1. Open the Preview modal (`setPreviewConcept(concept)`)
2. AND immediately show the text editor panel inside that modal (`showTextEditor = true` by default)
The Preview modal's text editor should expand automatically when arriving via Edit.

---

### Issue 3 — Gray transparent background in the text editor left panel (UX)

**Root cause:** The left panel `bg-white rounded-2xl` card at line 469 has a `space-y-4` container but the parent page background is a gradient (`bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]`). When the text editor tab is open and the user scrolls, the card appears translucent because it lacks a fully opaque solid background and `overflow: hidden` is not set. The text floats above the page content.

**Fix:** 
- Add `bg-white` with `overflow-y-auto` and a fixed `max-height` to the left panel card
- Ensure the left panel has `sticky top-[...] self-start` so it doesn't scroll with the page — keeping it anchored

---

### Issue 4 — Insufficient padding above the stamp preview card (UX)

**Root cause (line 394):** The page wrapper uses `pt-24 sm:pt-28 lg:pt-32` but the sticky header strip (line 412) uses `sticky top-24 sm:top-28 lg:top-32`, which is correct. However, the main content area below starts at `py-6` (line 448), making the first card (the Trade License uploader) sit immediately under the sticky strip with minimal breathing room.

**Fix:** Change `py-6` → `pt-10 pb-6` on the main content wrapper (line 448) to add more space between the sticky header and the first card.

---

### Issue 5 — "Generate" changes the whole design instead of just the monogram/logo (Critical)

**Root cause:** The "Regenerate" button calls `generateConcepts()` which completely regenerates ALL 11+ stamp templates from scratch. The T12 "Bilingual Logo Center" template (which the user set as their standard) is regenerated fresh each time — losing any customization. 

More critically: the user's requested **standard template structure** (English top arc, Arabic bottom arc, gold monogram center with license number, "Dubai, UAE", elegant divider) IS T12 in `stampTemplates.ts` — but the gold color is hardcoded as `COLOR = '#1a2744'` (dark navy), not the gold palette the user selected. The color picker controls (`primaryColor`, `secondaryColor`) are only applied to the rendered preview via `StampSVGRenderer`'s tint replacement — they work at render time — but the SVG source itself still hardcodes `#1a2744`.

The problem is the user sees gold in the initial sample but when they generate, the SVG source still has navy. The `StampSVGRenderer` replaces `#1a2744` → the selected gold color, so it SHOULD work — but only if `tintColor` is set to gold.

**Real fix:** 
- When clicking "Edit" or opening Preview, pass `fontWeight`, `fontStyle`, `fontSize`, and `fontFamily` through to the `StampPreviewModal` so the preview there also shows the live typography settings
- Add a "Adapt This Design" button in the Preview modal that keeps the current design's structure but calls the AI refiner just on the chosen concept, not regenerating all 11
- Add a "Go to Gallery" button in the Preview modal linking to `/gallery`

---

### Issue 6 — Preview shows only Business Card, Letterhead, Envelope (UX Enhancement)

The user wants to see the stamp on: document, passport/ID card, contract, notebook, wax seal on paper, wall signage. The current `StampPreviewModal` has 3 views: `business-card`, `letterhead`, `envelope`.

**Fix:** Add 3 more mockup views:
- **Contract / A4 Document** — Full A4 with signature area (already close to letterhead but with stamp in bottom-right as an "approval" seal)
- **Wax Seal on Paper** — Cream parchment background, stamp pressed as a wax seal impression with a subtle red/gold tint overlay
- **Notebook / Stationery** — Spiral notebook with company branding and stamp embossed on the cover

---

## Technical Implementation Plan

### File 1: `src/components/stamp-generator/StampGeneratorPage.tsx`

**Change A — Add top padding (1 line):**
```tsx
// Line 448: change py-6 → pt-10 pb-6
<div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
```

**Change B — Fix `handleEditText` to open Preview modal with text editor open:**
```typescript
function handleEditText(concept: StampDesignConcept) {
  setSelectedId(concept.id);
  setPreviewConcept(concept);  // ← open the preview modal
  setOpenWithEditor(true);     // ← new state to auto-open text editor in modal
}
```
Add new state: `const [openWithEditor, setOpenWithEditor] = useState(false);`
Pass to `StampPreviewModal`: `<StampPreviewModal initialShowEditor={openWithEditor} .../>`

**Change C — Left panel sticky + solid background:**
Add `sticky top-[calc(theme(spacing.24)+56px)] self-start overflow-hidden` to the left panel wrapper, and give the inner card a solid `bg-white` with `overflow-y-auto max-h-[calc(100vh-240px)]`.

**Change D — Pass typography props to `StampPreviewModal`:**
Add `fontFamily`, `fontWeight`, `fontStyle`, `fontSize` as props to `StampPreviewModal` so the preview inside shows the same typography the user set in the fonts panel.

---

### File 2: `src/components/stamp-generator/StampPreviewModal.tsx`

**Change A — Accept `initialShowEditor` prop and default `showTextEditor` to it:**
```typescript
const [showTextEditor, setShowTextEditor] = useState(props.initialShowEditor ?? false);
```

**Change B — Add 3 new mockup views:**
Add `'contract'`, `'wax-seal'`, `'stationery'` to the `MockupView` type and render them:

- `contract`: White A4 with header band, body text lines, **bottom-right stamp** as approval, signature line — style as "APPROVED" overlay
- `wax-seal`: Cream/parchment background full panel. Stamp rendered with a warm amber tint overlay, slight blur, and circular border to simulate a wax impression
- `stationery`: Dark navy notebook cover with embossed stamp + company name in gold

**Change C — Add "Adapt Design" and "Go to Gallery" buttons:**
Below the "Select & Export" button, add:
```tsx
<Button variant="outline" onClick={() => sendRefinement(concept)}>
  Adapt Design (AI)
</Button>
<Button variant="ghost" onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/gallery`)}>
  Go to Gallery
</Button>
```

**Change D — Fix text editor panel background:**
Replace the current `bg-[hsl(var(--pearl-1))]` wrapper of `StampTextEditor` inside the modal with `bg-white border border-[hsl(var(--border))] rounded-xl p-3` for a solid opaque panel.

---

### File 3: `src/lib/stampTemplates.ts`

**Change A — Add reg number to T12 bilingual template:**
The T12 template currently shows `city · country` below the center artwork (line 751–755). Add registration number display there when `registration_number_optional` is set:

```typescript
const cityLine = `
  <text x="${cx}" y="${divBot + 12}" text-anchor="middle" font-family="${font}" font-size="7" 
    fill="${COLOR}" letter-spacing="4">${city}</text>
  ${regNo ? `<text x="${cx}" y="${divBot + 23}" text-anchor="middle" font-family="${font}" 
    font-size="6.5" fill="${COLOR}" letter-spacing="2">${regNo}</text>` : ''}
`;
```

This directly addresses the user's request for the registration/license number inside the standard T12 design.

**Change B — Add elegant divider flanking city line in T12:**
Instead of just the `hRule` lines, add the `divider()` ornament below the center artwork in T12:

```typescript
// After the center art, before cityLine:
${divider(cx, divBot + 2, COLOR, 24)}
```

---

## Summary of Files Changed

| File | Changes | Scope |
|---|---|---|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Padding fix, Edit→Preview modal fix, left panel sticky+opaque, pass typography to modal | ~20 lines |
| `src/components/stamp-generator/StampPreviewModal.tsx` | Accept `initialShowEditor`, 3 new mockup views, opaque text editor bg, "Adapt Design" + "Go to Gallery" buttons | ~80 lines |
| `src/lib/stampTemplates.ts` | Add reg number + divider ornament to T12 template | ~10 lines |

No edge function changes. No database changes needed.

---

## Key Behaviors After Fix

1. **Edit button** → opens Preview modal with text editor **already expanded** — no hunting for a left panel
2. **Logo in preview** → slider inside the Preview modal visually scales the stamp (CSS transform on the SVG container, no clipping)  
3. **Padding** → 40px gap between sticky header and first content card
4. **Text editor background** → fully opaque white, no transparent bleed-through
5. **Preview mockups** → 6 total: Business Card, Letterhead, Envelope, Contract, Wax Seal, Stationery
6. **T12 standard design** → shows reg number + elegant divider below center artwork
7. **After generation** → "Adapt Design" and "Go to Gallery" options available in the Preview modal
