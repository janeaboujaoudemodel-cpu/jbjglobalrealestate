

## Plan: Fix Chat/Arrow Overlap, Layout Alignment, Chat Auto-Close Bug & Deploy All Edge Functions

---

### Issue 1: Chat Widget Overlapping Navigation Arrow

**Root cause**: Both `CollapsedChatButton` (`bottom-20 right-6 z-[10050]`) and `PageNavigation` (`bottom-24 right-4 z-[9990]`) occupy the same bottom-right corner. The chat button sits on top of the arrow due to higher z-index.

**Fix**: Hide `PageNavigation` arrows whenever the chat widget is open (not collapsed).

**Changes**:
- `src/components/MainLayoutWrapper.tsx`: Pass a `chatOpen` prop or use a shared state
- Better approach — `src/components/MainLayout.tsx` (lines 283-292): The chat widget and PageNavigation are both rendered here. Pass `isChatCollapsed` state to PageNavigation to conditionally hide it.
- `src/components/MainLayoutWrapper.tsx` (line 13): Remove standalone `<PageNavigation />` — it's redundant since MainLayout already controls layout
- Actually, PageNavigation is in MainLayoutWrapper, not MainLayout. Move the logic: when chat is open (`effectiveCollapsed === false`), don't render PageNavigation.
- Add a CSS class or React context to communicate chat open state to PageNavigation, OR simply move PageNavigation rendering into MainLayout where `effectiveCollapsed` is already available, and conditionally render it.

**Simplest approach**: Move `<PageNavigation />` from `MainLayoutWrapper.tsx` into `MainLayout.tsx` right before the chat widget, and wrap it with `{effectiveCollapsed && <PageNavigation />}` so arrows hide when chat opens.

**Files**: `src/components/MainLayout.tsx`, `src/components/MainLayoutWrapper.tsx`

---

### Issue 2: Chat Auto-Closes (Bug)

**Root cause** (line 91-100 in MainLayout): There's an auto-minimize timer that collapses chat after 8 seconds on desktop:
```typescript
if (!isChatCollapsed) {
  const timer = window.setTimeout(() => setIsChatCollapsed(true), 8000);
  return () => window.clearTimeout(timer);
}
```
This fires every time the chat opens, closing it after 8s. This was designed for the initial attention pulse, not for active chat sessions.

**Fix**: Remove the 8-second auto-collapse timer entirely. The user should control when to minimize via the minimize button. The attention pulse already has its own dismiss logic via `handleMinimizeChat`.

**File**: `src/components/MainLayout.tsx` (lines 91-100)

---

### Issue 3: Content Behind Header (Sticky Headers at `top-0`)

**Root cause**: Multiple tool pages (BusinessCardDesigner, LandingPageBuilder, CVResumeBuilder, CoverLetterGenerator, CompanyProfileBuilder) have `sticky top-0` headers. Since these pages render inside MainLayout's `<main>` which already has `pt-[52px]`, the sticky header sticks at `top: 0` which is behind the HorizontalUtilityBar (which is `fixed top-0 h-[48px]`).

**Fix**: Change `sticky top-0` to `sticky top-[48px] lg:top-[48px]` on all corporate suite tool headers so they stick below the utility bar on desktop. On mobile, keep `top-0` since the GlobalHeader handles spacing differently.

**Files** (5 files):
- `src/components/corporate-suite/BusinessCardDesigner.tsx` (line 1626)
- `src/components/corporate-suite/LandingPageBuilder.tsx` (line 155)
- `src/components/corporate-suite/CVResumeBuilder.tsx` (line 1051)
- `src/components/corporate-suite/CoverLetterGenerator.tsx` (line 508)
- `src/components/corporate-suite/CompanyProfileBuilder.tsx` (line 1005)

---

### Issue 4: ChatConfirmDetails `forwardRef` Warning

**Root cause** (console error): `AIChatWidget` renders `ChatConfirmDetails` inside `AnimatePresence > motion.div`, and React warns about refs on function components. `ChatConfirmDetails` is a plain function component but receives a ref via AnimatePresence's children detection.

**Fix**: This is a non-blocking warning. The component doesn't need a ref. No action required — it's cosmetic.

---

### Issue 5: Deploy All Edge Functions

There are 200+ edge functions. The deployment tool will handle this. I'll deploy them all in a single batch after the code fixes are applied.

---

### Summary of Changes

| File | Change |
|------|--------|
| `src/components/MainLayout.tsx` | Remove 8s auto-collapse timer; add `<PageNavigation />` conditionally (hidden when chat open) |
| `src/components/MainLayoutWrapper.tsx` | Remove `<PageNavigation />` (moved to MainLayout) |
| `src/components/corporate-suite/BusinessCardDesigner.tsx` | `sticky top-0` → `sticky top-0 lg:top-[48px]` |
| `src/components/corporate-suite/LandingPageBuilder.tsx` | Same sticky fix |
| `src/components/corporate-suite/CVResumeBuilder.tsx` | Same sticky fix |
| `src/components/corporate-suite/CoverLetterGenerator.tsx` | Same sticky fix |
| `src/components/corporate-suite/CompanyProfileBuilder.tsx` | Same sticky fix |
| Edge functions | Deploy all functions |

