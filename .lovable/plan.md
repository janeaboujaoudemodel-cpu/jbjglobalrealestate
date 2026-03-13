

## Deep Audit — Stamp Generator Previous Tasks

### Audit Results

| Task | Status | Details |
|------|--------|---------|
| **Ink texture filter** | ✅ Implemented | `StampSVGRenderer.tsx` has `INK_TEXTURE_FILTER` with proper DOMPurify config (`ADD_TAGS` includes all filter primitives, `ADD_ATTR` includes `opacity`). Filter injects correctly when `inkMode=true`. |
| **Multi-color export** | ✅ Implemented | `StampExportPage.tsx` lines 759-783: "Quick Download in Color" section with `PACK_COLORS` swatches. Also includes Multi-Color ZIP Pack (lines 809-888). |
| **Smart Auto-Fill collapsed in Studio** | ✅ Implemented | `StampGeneratorPage.tsx` lines 842-878: Collapsed to "Re-scan Trade License" link, with expandable section. |
| **Left panel widened to 240px** | ✅ Implemented | `StampGeneratorPage.tsx` line 572: `w-[240px]`. |
| **Gallery layout fixed** | ✅ Implemented | `StampGalleryPage.tsx` line 409: `h-[calc(100vh-52px)] flex flex-col overflow-hidden`. |
| **Per-character bottom arc** | ✅ Implemented | `stampOfficialTemplate.ts` lines 81-108: `renderBottomArcText` with per-character placement. |
| **Color tokens (Primary/Secondary/Accent)** | ✅ Implemented | Both `stampOfficialTemplate.ts` and edge function use `#1a2744`, `#2a3a5c`, `#8b6914`. |
| **Pagination in concepts grid** | ✅ Implemented | `StampGeneratorPage.tsx` line 36: `CONCEPTS_PER_PAGE = 6`, with prev/next buttons. |
| **Smart Designer panel position** | ✅ Implemented | Line 990: `top: 60`. |
| **Draft persistence via localStorage** | ❌ NOT DONE | `StampGeneratorPage.tsx` lines 4-9 still use `sessionStorage`, not `localStorage`. No "Resume draft?" dialog on load. |
| **Shape-aware concept cards** | ❌ NOT VERIFIED | Need to check `ConceptCard` component for rectangular frame detection. |

### Issues Visible in Screenshot (Wizard Page `/toolkit/stamp-generator/new`)

1. **Smart Auto-Fill still fully visible in Wizard** — `StampProjectWizard.tsx` line 374-396 shows full `StampLicenseUploader` card with upload area. The collapse fix was only applied to `StampGeneratorPage`, not the Wizard. The user sees it prominently on the Company tab.

2. **Preview stamp text overlapping circles** — In `LiveStampPreview.tsx` for EN-only round stamps (lines 226-281), text uses `arcR = innerRx - 6` which places text too close to the inner ring. The `clipPath` at `clipR = innerRx - 2` hard-clips text rather than providing breathing room.

3. **"Your Company Name" placeholder rendering outside stamp** — When no company name is entered, the preview shows placeholder text that extends beyond the circle boundaries because the auto-fit calculation doesn't account for the placeholder text length properly.

4. **Wizard right-side padding** — The Arabic details box (line 466) and form fields have adequate padding (`p-3`), but the overall scroll area's form content extends to the edge at smaller widths because the left panel is `w-[320px]` fixed.

### Remaining Issues NOT Yet Fixed

5. **`sessionStorage` → `localStorage` migration** — Draft persistence still uses `sessionStorage` (clears on tab close). Need to switch to `localStorage` and add recovery prompt.

6. **Wizard Smart Auto-Fill not collapsed** — The wizard's Company tab shows the full license uploader card instead of a minimal link.

### Implementation Plan

**A. Fix LiveStampPreview text clearance** (`LiveStampPreview.tsx`)
- Increase text arc inset: change `arcR = innerRx - 6` to `arcR = innerRx - 10` for more breathing room
- Change clip radius from `clipR = innerRx - 2` to `clipR = innerRx - 4`
- Reduce max font size from 11 to 10 to prevent text overflow on placeholder

**B. Collapse Smart Auto-Fill in Wizard** (`StampProjectWizard.tsx`)
- Replace the always-visible `StampLicenseUploader` card (lines 374-396) with a collapsible "Smart Auto-Fill from Trade License" link, matching the pattern used in `StampGeneratorPage.tsx` lines 842-878
- Default collapsed. Show a single-line button "Upload Trade License for Auto-Fill"

**C. Switch to localStorage for draft persistence** (`StampGeneratorPage.tsx`)
- Replace `sessionStorage` helpers (lines 4-9) with `localStorage`
- On component mount, check for existing draft data and show a toast/dialog: "Draft found — Resume or Start Fresh?"

**D. Fix concept card shape detection** (`StampGeneratorPage.tsx`)
- In the `ConceptCard` component, detect if SVG contains `<rect` without `<circle` → use rectangular container instead of circular background

### Files to modify
1. `src/components/stamp-generator/LiveStampPreview.tsx` — text clearance fix
2. `src/components/stamp-generator/StampProjectWizard.tsx` — collapse auto-fill
3. `src/components/stamp-generator/StampGeneratorPage.tsx` — localStorage migration, shape-aware cards

