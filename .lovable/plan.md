
## Goal (what will be fixed)
1) **Projects filters (sticky header)**: Residential/Commercial toggle shows proper **champagne-gold active styling**, works on **mobile**, and the horizontal filter bar shows an **always-visible premium scroll affordance** (not only the temporary gray iOS indicator).  
2) **Homepage “Handpicked For You”**: enforce your exact sequencing rules: **Amra is card #1**, **no duplicate developers**, and **DAMAC appears after ALDAR** (not before).  
3) **Homepage developer partners marquee**: **pause exactly where you hover** so it’s easy to click; clicking must feel instant.  
4) **E‑Signature**: fix the “screen frozen / only preview scrolls” issue and re-center the preview. Add **Signature/Stamp first-time creation inside the flow**, plus **bulk page operations** (reorder/duplicate/delete) and **bulk field actions** (apply signature/stamp to all pages, multi-select field ops).

---

## 1) Property Type (Residential/Commercial) active color + mobile filter visibility
### What’s wrong in code now
- `FilterShortcutBar.tsx` uses Radix `TabsTrigger` defaults (`data-[state=active]:bg-background`) which becomes “white/blue-ish” looking and not aligned with the locked champagne active layer.
- Some mobile popovers feel “not showing” because the header is fixed + scroll overlays can steal taps and the active state isn’t visually obvious.

### What we’ll build
- **Premium tabs styling** for Residential / Commercial inside the Property Type popover:
  - Active = `bg-[var(--jj-gradient-active)]`, `border-gold`, `text-black`, stronger shadow
  - Inactive = soft pearl background + gold border hover
- Ensure `PopoverContent` is always visible on mobile:
  - add collision padding and mobile-friendly alignment (center when needed)
  - ensure right-edge scroll overlay controls do **not** block taps on pills (padding/right inset fix)

### Files
- `src/components/filters/FilterShortcutBar.tsx` (property type popover tabs + popover collision behavior + tap-safe padding)

---

## 2) Premium “always-visible” horizontal scroll affordance for filter strips (desktop + mobile)
### What’s wrong in code now
- `scrollbar-hide` intentionally hides the scrollbar (`src/App.css`), so users only see the temporary OS indicator (gray) during movement.
- You want a **persistent premium indicator**: users must always realize it’s scrollable and be able to “grab” it.

### What we’ll build (premium, cross-device)
A reusable component: **`PremiumHorizontalScrollHint`**
- Renders:
  1) **Left/Right premium arrows** (always visible; disabled style when not scrollable)
  2) A thin **gold “scroll rail”** under the strip (always visible) with a **draggable thumb** that maps to `scrollLeft`
  3) Subtle fade edges to indicate overflow (kept)

### Where we will apply it
- FilterShortcutBar Row 1 and Row 2 (`row1Ref`, `row2Ref`)
- Project detail sticky curated shortcuts row (the `tabNavRef` strip in `ProjectDetailLayout.tsx`)

### Files
- `src/components/ui/PremiumHorizontalScrollHint.tsx` (new)
- `src/components/filters/FilterShortcutBar.tsx` (integrate hint for both rows; remove/avoid `scrollbar-hide` where we now provide the premium rail)
- `src/components/project-detail/ProjectDetailLayout.tsx` (integrate hint for curated shortcut strip)

---

## 3) Fix “Handpicked For You” sequencing + remove duplicate developers (ALDAR duplicated now)
### What’s wrong in code now
In `FeaturedListings.tsx`, `addOne('ALDAR')` is called **twice**, causing duplicates.

### What we’ll build (exact rules)
- Selection algorithm changes:
  1) Pick **Amra first** by project name match (`name includes "amra"`) regardless of developer_name.
  2) Then pick one each (no duplicates) in your desired variety order:
     - Emaar → Nakheel → Sobha (Pinnacle) → Meraas → Binghatti (Mercedes) → ALDAR → **DAMAC (non-Amra)**  
  3) If any slot can’t be filled, fill from remaining elite developers **not already represented** (Omniyat etc.), still no duplicates.

### Files
- `src/components/home/FeaturedListings.tsx`

---

## 4) DeveloperPartnersMarquee: pause on hover + instant click
### What’s wrong in code now
- The marquee is CSS animated and never pauses, so it’s hard to click a specific developer.

### What we’ll build
- Add hover pause:
  - on hover of **any** partner item (or the marquee area), set `animation-play-state: paused`
  - resume on mouse leave
- Keep the developer list “LOCKED” exactly as it is; only behavior changes.

### Files
- `src/components/DeveloperPartnersMarquee.tsx`

---

## 5) E‑Signature: unfreeze scroll + centered preview + “create signature/stamp first” + bulk operations
You selected all three scopes: **Edit PDF pages**, **Apply to all pages**, **Fields only**. We will implement them in the sender flow (`/e-signature/create`, Step 3) because that’s where page/field operations belong.

### 5.1 Fix the “screen frozen” scrolling behavior
#### Likely cause in current code
`DocumentFieldPlacer` uses nested scroll containers with:
- fixed heights (`780px`, `1200px`)
- `overscrollBehavior: "contain"` which prevents scroll chaining on mobile (makes the rest of the page feel “stuck”)

#### Fix
- Remove/relax `overscrollBehavior: contain` on the main overlay scroll container to allow **scroll chaining**
- Make heights responsive (`maxHeight: calc(100dvh - header/footer offsets)`) so the page remains usable on mobile
- Ensure preview is visually centered (max-width wrapper + centered layout)

### 5.2 “Add new first” for Signature + Stamp inside the flow
#### What exists now
- Signatures: saved via `AISignatureDesigner` into `ai_tool_projects`
- Stamps: `DocumentFieldPlacer` pulls favorite `stamp_designs.svg_source`, but there’s no in-flow creation/upload UI

#### What we’ll add
A “My Signature & Stamp” panel in Step 3:
- “Create / Add Signature”:
  - draw via `ESignaturePad`
  - optionally upload an image (PNG/JPG) for signature
  - save as a reusable asset (same storage/persistence approach as signatures)
- “Create / Add Stamp”:
  - link to Stamp Generator
  - optionally upload stamp image as fallback
  - `DocumentFieldPlacer` will render either SVG stamp (preferred) OR uploaded image

### 5.3 Bulk actions (pages + fields)
#### PDF Pages (Edit PDF pages)
Add a “Pages” edit mode:
- Select pages (multi-select)
- Actions: **delete**, **duplicate**, **move left/right** (reorder)
- On every change:
  - thumbnails update
  - fields remap to the new page positions
- On final submit (Step 4 → Send):
  - generate a **new PDF** with pdf-lib reflecting the edited pages
  - upload that processed PDF instead of the original

#### Fields (Fields only + Apply to all pages)
- Multi-select fields in the right sidebar list (checkboxes)
- Actions: delete selected, duplicate selected, move to page
- “Apply to all pages” button:
  - duplicates selected **Signature/Stamp** fields across all pages (same position per page)

### Files
- `src/components/e-signature/DocumentFieldPlacer.tsx` (scroll fix, centering, page editor model, field multi-select + bulk actions, signature/stamp asset usage)
- `src/pages/e-signature/CreateEnvelope.tsx` (accept processed PDF output from step 3 and upload that; add “My Signature & Stamp” panel entry points)
- (If needed) `src/pages/e-signature/ContractReview.tsx` and `src/pages/e-signature/SignDocument.tsx` to ensure preview centering + no scroll trapping in simple preview pages too (consistent behavior)

---

## Testing & proof (will be done after implementation)
1) **Mobile filter bar**: verify popovers open and Residential/Commercial active state is champagne-gold.  
2) **Scroll affordance**: verify arrows + draggable rail are always visible and functional on mobile + desktop for filter strips and project sticky shortcuts.  
3) **Handpicked**: verify order shows **Amra first**, no duplicated developers, DAMAC after ALDAR.  
4) **Developer marquee**: verify hover pauses at the hovered logo and click is immediate.  
5) **E‑Signature**:
   - upload a PDF, confirm page scroll is not “frozen”
   - preview is centered
   - page delete/duplicate/reorder works and fields remap correctly
   - apply signature/stamp to all pages works
   - final sent document uses the processed PDF
6) Capture **screenshots** of the fixed e‑signature preview and the corrected filter UI as evidence.

---

## Implementation checklist (files touched)
- `src/components/filters/FilterShortcutBar.tsx`
- `src/components/ui/PremiumHorizontalScrollHint.tsx` (new)
- `src/components/project-detail/ProjectDetailLayout.tsx`
- `src/components/home/FeaturedListings.tsx`
- `src/components/DeveloperPartnersMarquee.tsx`
- `src/components/e-signature/DocumentFieldPlacer.tsx`
- `src/pages/e-signature/CreateEnvelope.tsx`
- (Optional, if needed for consistency) `src/pages/e-signature/ContractReview.tsx`, `src/pages/e-signature/SignDocument.tsx`
