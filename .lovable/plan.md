

## Stamp Generator — Speed, Layout, Borders, Mockups & Cross-Tool Fixes

### Problem Summary

1. **Slow generation**: Edge function calls `google/gemini-2.5-pro` (expensive model) just to reorder 7 templates. This adds 5-15s latency for zero visual difference.
2. **Layout imbalance**: Center preview is only 280px wide; concepts grid takes remaining space. Preview too small to see/edit.
3. **Border controls insufficient**: No option for thick outer + thin inner differentiation, no divider/separator granularity.
4. **SVG text touching borders**: Template `buildSVG` uses tight radii without padding constraints. Text overflows into ring strokes.
5. **Mockup issues**: Business card uses dark blue background (stamp invisible on blue ink), no color options for mockup backgrounds, wax seal inconsistent with preview.
6. **Select flow wrong**: Clicking "Select" opens document mockups immediately instead of showing enlarged preview first.
7. **Preview not editable when expanded**: Fullscreen overlay shows stamp but editing controls (colors, alignment, text) not accessible.
8. **Designs lost on navigation**: Pressing back/forward regenerates — concepts should persist in localStorage.
9. **PageNavigation arrows**: Currently at `left-4 bottom-24`, chat at `right-6 bottom-20` — arrows disappeared per user. Need to ensure visibility.
10. **Desktop notice**: Already removed per memory, but need to verify mobile-only enforcement.
11. **Palette integration**: Clicking a palette preset should apply all 3 colors to preview with live wire showing where each color maps.

---

### Implementation Plan

#### 1. Edge Function Speed — Hybrid Instant + Enrich

**File: `supabase/functions/ai-stamp-generator/index.ts`**

- Change the `generate` action to **return deterministic concepts immediately** without waiting for AI ordering.
- Switch AI model from `google/gemini-2.5-pro` to `google/gemini-2.5-flash-lite` (fastest, cheapest) for the ordering step.
- Run AI ordering **asynchronously after response**: save concepts first with default order, then if AI returns within 3s, update the order in the DB (client can poll or ignore).
- Actually: simpler approach — just remove the AI ordering call entirely from `generate`. The template order is already good. AI adds no visual value for ordering 7 static templates. This makes generation **instant** (< 500ms).
- Keep AI only for the `refine` action where it genuinely creates new SVG. Switch refine model to `google/gemini-3-flash-preview` for faster responses.

#### 2. Layout — Adaptive, Bigger Preview

**File: `src/components/stamp-generator/StampGeneratorPage.tsx`**

- **Desktop (>1024px)**: Change from `w-[240px] | w-[280px] | flex-1` to `w-[220px] | flex-1 (center preview) | w-[320px] (concepts)`. Preview becomes the dominant area.
- Increase preview stamp size from 220px to 320px.
- Add a **Maximize button** on the preview panel that expands it to take ~60% of the width, collapsing the concepts grid to a single column.
- **Tablet/Mobile**: Stack preview on top (sticky) with scrollable controls + concepts below in tabs.

#### 3. Border Controls — Thick Outer / Thin Inner + Divider Options

**File: `src/components/stamp-generator/StampProjectWizard.tsx`** (wizard) and **`src/lib/stampOfficialTemplate.ts`** + **edge function**

- Add to `FormState` and `OfficialStampConfig`:
  - `outerBorderWidth: number` (range 1-8, default 3)
  - `innerBorderWidth: number` (range 0.5-4, default 1.5)
  - `dividerStyle: 'line' | 'diamond' | 'ornate' | 'none'` (currently hardcoded to diamond)
- Add UI controls in the Style tab under Border section: two sliders for outer/inner width, divider style selector.
- Wire these into `generateOfficialStampSVG` and the edge function's `buildSVG`.

#### 4. SVG Text Clearance Fix

**Files: `src/lib/stampOfficialTemplate.ts`, `supabase/functions/ai-stamp-generator/index.ts`**

- In `bilingualCircularStamp`: reduce `safeArc` from 70% to 65% of half-circumference.
- Enforce minimum 3px clearance between text arc radius and ring radius.
- In `fitFontSize`: add a hard minimum of 6.5px (currently 7px for client, but edge function allows smaller).
- For rectangle/square templates: add `x` offset padding of 12px from inner border.

#### 5. Mockup Background Options

**File: `src/components/stamp-generator/StampPreviewModal.tsx`**

- Add a **background color selector** above the mockup area: White, Cream, Dark Navy, Black, Custom.
- Business card mockup: default to **white** background instead of dark navy. Add color picker.
- Letterhead: use white with subtle header band in stamp color.
- Wax seal: wire the actual stamp SVG colors consistently (currently uses hardcoded filter).
- Show stamp at consistent size across all mockups (scale proportionally).

#### 6. Select Flow — Preview First

**File: `src/components/stamp-generator/StampGeneratorPage.tsx`**

- `handleSelectConcept`: Currently shows a toast. Change to: set `selectedId`, auto-scroll the center preview to show the selected stamp prominently, but do NOT open the modal.
- Add a "View on Documents" button inside the center preview panel that opens `StampPreviewModal`.
- Remove the "Preview on Documents" button from ConceptCard; replace with just "Expand" which scrolls to the center preview.

#### 7. Editable Fullscreen Preview

**File: `src/components/stamp-generator/StampPreviewModal.tsx`**

- In the fullscreen overlay (`stampFullscreen`), add the full editing toolbar: color stop buttons, font selector dropdown, ink mode toggle, text editor toggle.
- Wire all changes from fullscreen back to parent state via callbacks.
- Add "Expand the preview for better editing experience" tooltip on first open.

#### 8. Design Persistence

**File: `src/components/stamp-generator/StampGeneratorPage.tsx`**

- On concept load/generate, save concepts to `localStorage` keyed by `stamp-concepts-${projectId}`.
- On page load, check localStorage first before calling the edge function.
- Only regenerate when user explicitly clicks "Regenerate" or `?fresh=1`.
- Save `svgOverrides` to localStorage too, keyed by project.

#### 9. PageNavigation Arrow Fix

**File: `src/components/PageNavigation.tsx`**

- The component returns `null` when `!showUp && !showDown`. On stamp generator pages (which use `overflow-hidden` on the main container), `scrollHeight === clientHeight`, so arrows never show.
- Fix: detect if the current route is a full-height studio tool and skip rendering (already correct behavior — arrows aren't needed on studio pages since there's no scroll).
- The user's complaint might be about other pages. Ensure the arrows render on scrollable pages by verifying the scroll listener fires correctly.

#### 10. Palette Live Wire Preview

**File: `src/components/stamp-generator/StampGeneratorPage.tsx`**

- When user clicks a palette preset, show a brief animated indicator on the center preview showing which element each color maps to (e.g., "Primary → Borders & Text", "Secondary → Inner Rings", "Accent → Monogram").
- Add labeled color dots next to the preview showing the active mapping.

---

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ai-stamp-generator/index.ts` | Remove AI ordering from generate, switch refine model to flash, fix text clearance |
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Layout rebalance (bigger preview), design persistence, select flow, palette wire |
| `src/components/stamp-generator/StampPreviewModal.tsx` | Mockup bg options, white business card, editable fullscreen, wax seal consistency |
| `src/components/stamp-generator/StampProjectWizard.tsx` | Border width sliders, divider style selector |
| `src/lib/stampOfficialTemplate.ts` | Border width params, text clearance fix, divider styles |
| `src/components/PageNavigation.tsx` | Verify arrow visibility on scrollable pages |

### Edge Function Deployment

The `ai-stamp-generator` edge function will be redeployed with the performance improvements (no AI ordering, faster refine model).

