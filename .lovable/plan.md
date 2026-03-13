

## Stamp Generator — Comprehensive Fix & Upgrade Plan

This plan addresses all issues raised: navigation arrows visibility, "Select" behavior, mockup consistency & interactivity, wax seal quality, palette wiring, fullscreen editing, and layout fixes.

---

### Issues & Fixes

**1. PageNavigation arrows disappeared**
- `MainLayout.tsx` line 280: `{effectiveCollapsed && <PageNavigation />}` — arrows only render when chat is collapsed. But `effectiveCollapsed` means the chat widget itself is collapsed (not open). The logic is correct. The arrows are at `left-4` now (moved in prior fix). They may not show because the stamp generator page uses `h-[calc(100vh-52px)]` with `overflow-hidden` — there's no scroll, so `showScrollTop`/`showScrollBottom` are both false and the component returns null.
- **Fix**: Always show PageNavigation regardless of chat state (remove `effectiveCollapsed` guard), AND make the arrows visible on fixed-viewport pages by detecting when the page has scrollable content OR when there are toolkit pages that benefit from scroll-to-top.

**2. "Select" on concept card immediately opens StampPreviewModal**
- `handleSelectConcept` sets both `selectedId` and `previewConcept`, which opens the modal immediately.
- **Fix**: Split behavior — clicking "Select" only sets `selectedId` (updates center Live Preview). Show a toast: "Design selected — click Edit & Export to preview on documents". Only open modal when user clicks "Edit & Export" or the explicit "Preview" button.

**3. Mockup consistency — stamp not matching preview**
- The `StampPreviewModal` renders `StampSVGRenderer` with `displaySvg` but does NOT pass `fontFamily`, `fontWeight`, `fontStyle`, `fontSize`, or `inkMode` to the mockup renderers (business card, envelope, etc.). Only the left panel preview gets these props.
- **Fix**: Pass all typography + ink props to every `StampSVGRenderer` instance in every mockup view.

**4. Wax seal looks cheap with too many circles**
- Current wax seal has 4 nested divs (outer glow, main disc, inner ring, second inner ring). The "second inner ring" (176px) is unnecessary.
- **Fix**: Remove the extra inner ring div. Keep only: outer embossed glow, main wax disc, single inner ring detail. Make the stamp impression larger and more prominent.

**5. Envelope stamp placement — center it or add alignment controls**
- Currently stamp is at `absolute top-5 right-7`.
- **Fix**: Add alignment state (`stampAlign`) with 3 buttons: Left, Center, Right. Default center for envelope.

**6. Fullscreen overlay doesn't pass editing controls**
- The fullscreen view only renders `StampSVGRenderer` at 420px with no editing capability.
- **Fix**: In fullscreen overlay, add the same color/typography controls as a floating toolbar so users can edit while viewing large.

**7. Book cover stamp positioning**
- Currently centered. User wants drag-to-position or alignment buttons.
- **Fix**: Add Left/Center/Right alignment buttons for all mockup views. Drag-to-position is Phase 2.

**8. Gray backgrounds in mockup editor**
- The mockup area uses pearl gradients already but some containers may show gray.
- **Fix**: Audit all mockup container backgrounds and ensure champagne/white theme. Remove any remaining gray cards.

**9. Palette integration — clicking palette should wire all 3 colors with live preview**
- Already works via `setPrimaryColor/setSecondaryColor/setAccentColor` on palette click. But the user wants visual indication of which color maps where.
- **Fix**: When hovering a palette, show a tooltip: "Primary: X, Secondary: Y, Accent: Z" with color swatches.

**10. Gold scrollbars**
- Add `jj-scrollbar-gold` class to all overflow-y-auto containers in StampPreviewModal and StampGeneratorPage.

---

### Files to Modify

1. **`src/components/MainLayout.tsx`** — Remove `effectiveCollapsed` guard from PageNavigation so arrows always render
2. **`src/components/PageNavigation.tsx`** — Show arrows even on non-scrollable pages (add a fallback "scroll to top" that's always visible after 200ms)
3. **`src/components/stamp-generator/StampGeneratorPage.tsx`**:
   - Split `handleSelectConcept` — only set `selectedId`, don't open modal
   - Add toast notification on select
4. **`src/components/stamp-generator/StampPreviewModal.tsx`**:
   - Pass typography + ink props to ALL mockup `StampSVGRenderer` instances
   - Remove extra inner ring from wax seal
   - Add stamp alignment controls (Left/Center/Right) for business card, envelope, book cover
   - Center envelope stamp by default
   - Add editing toolbar to fullscreen overlay
   - Replace any gray backgrounds with champagne/pearl
   - Add gold scrollbar classes
   - Add palette tooltip showing color mapping

