

# Fix Plan: Broken Video Routes + Full Redirect Audit

## Root Cause Found

The core bug is simple: **`/toolkit/video-studio` does not exist as a route**. Here's the chain:

1. In `AIToolRoutes.tsx` line 50, `/ai-video-tour-script` redirects to `/toolkit/video-studio`
2. No route for `/toolkit/video-studio` exists anywhere in the app
3. The actual routes are `/toolkit/video-suite` (tabbed suite) and `/toolkit/ai-video-studio` (standalone editor)
4. The non-existent route falls through to the `*` catch-all in `PublicRoutes.tsx` line 395 → shows the **404 NotFound page**

The previous implementation claimed to redirect to `/toolkit/video-studio` but that URL was never registered. This is why you see a blank/404 page.

---

## All Fixes Required

### Fix 1: Correct the redirect target in `AIToolRoutes.tsx`
- Line 50: Change `<Navigate to="/toolkit/video-studio" replace />` to `<Navigate to="/toolkit/video-suite" replace />`

### Fix 2: Add a safety redirect in `ToolkitRoutes.tsx`
- Add route: `/toolkit/video-studio` → redirect to `/toolkit/video-suite`
- This catches any other stale links pointing to the wrong URL

### Fix 3: Update all nav/config references from `/ai-video-tour-script` to `/toolkit/video-suite`
These files still link to the standalone `/ai-video-tour-script` URL (which now redirects, but should point directly to the correct destination):

| File | What to update |
|---|---|
| `src/pages/AIHub.tsx` line 413 | Change link from `/ai-video-tour-script` to `/toolkit/video-suite` |
| `src/pages/business-suite/CreativeSuite.tsx` line 29 | Change href from `/ai-video-tour-script` to `/toolkit/video-suite` |
| `src/pages/owner/AIToolsControlPanel.tsx` line 52 | Change link |
| `src/components/navigation/GlobalVerticalNav.tsx` lines 139, 436, 643 | Change href (3 instances) |
| `src/config/royalToolsRegistry.ts` line 317 | Change href |
| `src/config/allToolsSuiteConfig.ts` | Change href |
| `src/data/ai-tools-verified-inventory.ts` line 1063 | Update route |

### Fix 4: Clean up unused import in `AIToolRoutes.tsx`
- Line 23: `AIVideoTourScriptPage` is lazy-imported but never used (the route is a redirect). Remove the import.

### Fix 5: Update `RealEstateSuite.tsx` video-script tool
- Line 26 imports `AIVideoTourScriptPage` and line 142 maps it as a tool component
- This renders the standalone page inside the tabbed suite, which is fine and should keep working. No change needed here since the standalone component still exists.

---

## What Was NOT Broken (Verified Working)

- `/toolkit/video-suite` — Route exists at `ToolkitRoutes.tsx` line 90, renders `VideoSuite` component correctly with Edit/Resize/Captions tabs
- `/toolkit/ai-video-studio` — Route exists at line 104, renders standalone `AIVideoStudio`
- `VideoScriptPanel.tsx` — Created correctly, integrated into `IntegratedToolsPanel.tsx` as the "Script" tab inside the Video Studio
- `AIVideoTourScriptPremium.tsx` — Component exists, uses `export default`, barrel export is correct

---

## Implementation Order
1. Fix the redirect in `AIToolRoutes.tsx` (immediate fix)
2. Add safety redirect `/toolkit/video-studio` → `/toolkit/video-suite` in `ToolkitRoutes.tsx`
3. Update all 7+ nav/config files to point directly to `/toolkit/video-suite`
4. Remove unused `AIVideoTourScriptPage` import from `AIToolRoutes.tsx`

