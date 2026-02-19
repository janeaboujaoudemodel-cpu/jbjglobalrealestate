
# Fix: AI Video Studio Layout, Header Visibility, Tooltip Clipping & Empty State

## Issues Identified

### 1. Global Header Completely Covered
`AIVideoStudioPage.tsx` wraps the entire studio in `position: fixed; inset: 0; z-index: 10000`. This layer sits on top of the `GlobalHeader`, making navigation impossible. The user cannot go to any other page without using the browser's back button.

**Fix**: Change the page wrapper to reserve space for the global header by offsetting the top by the header height, OR by converting from `fixed inset-0` to a layout that lets the header sit above. The cleanest approach is to remove the `fixed inset-0` override on the page level and instead let `MainLayout` render the `GlobalHeader`, then make the studio use `h-[calc(100vh-header-height)]` within a normal flow.

Since the studio is used both standalone (`/toolkit/ai-video-studio`) and embedded inside `VideoSuite`, the safest fix is:
- In `AIVideoStudioPage.tsx`: Drop the `fixed inset-0 z-10000` wrapper. Use `min-h-screen` with the studio filling the available content area below the global header.
- In `AIVideoStudioLayout.tsx`: Change `h-screen` to `h-full` so it fills whatever container it's given.

### 2. Tooltip Clipped Under Timeline Header Bar
In `TimelineEditor.tsx`, `ToolBtn` renders the tooltip `bottom-full` (upward) with `z-[200]`, but it's inside a `flex flex-col bg-slate-900` container that has `overflow-hidden` set on outer parents. The tooltip gets cut off at the container boundary.

**Fix**: Change the tooltip to render **downward** (`top-full mt-1`) instead of upward on the timeline toolbar buttons, since the toolbar is at the top of the timeline section and there is space below. Alternatively, increase `z-index` and add `overflow: visible` to the parent containers in `AIVideoStudioLayout`. The simplest fix: change tooltip to `top-full` direction in `ToolBtn` so it pops below the button (into the timeline area), which always has space.

### 3. Empty State "Upload / Screen / Browse" Not Showing
The welcome screen only shows when `hasClips === false`. When the component is used inside the `VideoSuite` tab (`TabsContent`), the outer tabs panel might not be giving the canvas enough height, collapsing the empty state. This can also happen when the `VideoPreviewCanvas` is constrained by the layout's flex chain.

The root cause: `AIVideoStudioLayout` uses `h-screen` (full viewport height) which, combined with the `fixed inset-0` wrapper that starts at y=0, gives the studio the correct height. But if the header is now shown (after fix #1), `h-screen` minus the header means the content overflows. We need to use `h-full` throughout and let the container dictate the height.

**Fix**: 
- `AIVideoStudioLayout`: Change `h-screen` → `h-full` in both mobile and desktop renders.
- `AIVideoStudioPage.tsx`: Use a container that is `h-[calc(100vh-var(--header-height))]` or simply `flex-1 min-h-0` within the MainLayout flow, giving the studio the correct remaining height.
- Keep the empty state `absolute inset-0 flex items-center justify-center overflow-hidden` which is already correct — it just needs a parent with a defined height.

### 4. Export/Download Redundancy (Already Fixed)
The bottom export bar now only shows "Download All (ZIP)". The top bar has the primary "Export" button. This is already resolved.

---

## Files to Change

### `src/pages/toolkit/AIVideoStudioPage.tsx`
- Remove the `fixed inset-0 z-10000` wrapper div.
- Remove the `jj-hero-fullscreen` sentinel injection (we want the header to show and content pushed below it).
- Wrap the studio in a `div` that fills the remaining viewport height below the header: `style={{ height: 'calc(100vh - var(--header-h, 64px))' }}` or use flexbox approach.

### `src/components/ai-video-studio/layout/AIVideoStudioLayout.tsx`
- Change `h-screen` → `h-full` in the outer wrapper `div` for both mobile and desktop layouts.
- The parent page will provide the correct height context.

### `src/components/ai-video-studio/timeline/TimelineEditor.tsx`
- In the `ToolBtn` component, change the tooltip direction from `bottom-full mb-2` (appears above) to `top-full mt-2` (appears below the button, into the timeline content area).
- Change the triangle arrow from pointing down (`borderTop`) to pointing up (`borderBottom`), so it still connects correctly.
- Keep `z-[200]` but add `overflow-visible` on the containing toolbar `div` so the tooltip isn't clipped.

---

## Technical Detail: Header Height Variable

The GlobalHeader is rendered by `MainLayout`. When `needsHeaderSpacing` is true, `<main>` gets `pt-16 sm:pt-20 md:pt-24 lg:pt-28`. The studio container should consume the full `<main>` area. Since `<main>` is `w-full`, we can set the studio wrapper to use `flex-1` or a calculated height. The simplest cross-device approach is:

```text
MainLayout renders:
  <GlobalHeader />               ← visible at top
  <main className="pt-16 ...">   ← content starts below header
    <AIVideoStudioPage />
      <div style="height: calc(100vh - 64px)">   ← fills remaining space
        <AIVideoStudio />
```

On mobile the header is ~64px, on larger screens up to ~112px. Using CSS `100dvh` with a safe fallback avoids the need to hardcode. But since the main tag already has responsive padding-top, the studio div just needs `height: 100%` with the main tag being `min-h-[calc(100vh-64px)]`. The cleanest approach: set the studio wrapper to `height: 100vh` with `overflow: hidden` at the **page** level, but shift it down by not using `fixed`. The `main` tag will push it down; using `height: calc(100vh - var(--jj-header-h, 64px))` is the most precise.

## Summary of Changes

| File | Change |
|---|---|
| `AIVideoStudioPage.tsx` | Remove `fixed inset-0 z-10000`, remove sentinel injection, use `h-[calc(100vh-64px)]` wrapper |
| `AIVideoStudioLayout.tsx` | `h-screen` → `h-full` |
| `TimelineEditor.tsx` | Flip tooltip from upward to downward direction; add `overflow-visible` to toolbar container |
