

## Plan: Fix Search Modal Z-Index & Audit Global Overlay Stacking

### Root Cause

The search modal (`GlobalSearchModal.tsx`) uses `z-50` (= `z-index: 50`) for both its backdrop and panel. But the vertical sidebar uses `z-[9999]` and the horizontal bar uses `z-[9996]`. The search modal renders **behind** the entire navigation frame, making it appear cropped/hidden on the right side where the sidebar sits.

### Fix 1: GlobalSearchModal — Z-Index & Positioning

**File**: `src/components/GlobalSearchModal.tsx`

- **Backdrop** (line 413): Change `z-50` to `z-[10000]` — must sit above the sidebar (`z-[9999]`) and horizontal bar (`z-[9996]`)
- **Modal panel** (line 423): Change `z-50` to `z-[10001]` — above backdrop
- The `left-1/2 -translate-x-1/2` centering is fine since it's a fixed overlay that covers the full viewport with its own backdrop

### Fix 2: Audit All Other z-50 Overlays

After reviewing the 34 files using `z-50`, most are page-local modals (admin panels, design galleries, digital card shares) that don't conflict with the global nav because they render within their own page context. However, these global-level overlays also need the z-index bump:

| Component | Current | Fix To |
|-----------|---------|--------|
| `GlobalSearchModal.tsx` backdrop | `z-50` | `z-[10000]` |
| `GlobalSearchModal.tsx` panel | `z-50` | `z-[10001]` |
| `CommunitySearchModal.tsx` | Uses Dialog (already `z-[10200]` via popover) | No change needed |
| `CommandPalette` | Uses Dialog component | Check and fix if needed |

The page-specific `z-50` modals (admin chat, design gallery, CRM sidebar, etc.) are fine — they don't compete with the navigation frame because they render inside the main content area which is already offset by the sidebar.

### Files

| File | Changes |
|------|---------|
| `src/components/GlobalSearchModal.tsx` | Bump backdrop to `z-[10000]`, panel to `z-[10001]` |

