

## Plan: Performance Optimization — Loader Blink, Speed, Card Spacing & Edge Deploy

### Task 1: Fix Page Loading Blink

**Root cause:** The `PageLoader` and `InlinePageLoader` render instantly inside `<Suspense fallback>`. On fast networks, lazy chunks load in <200ms, causing a visible flash — black screen with logo appears then vanishes.

**Fix:** Create a `DelayedLoader` wrapper that only renders the loader after a 300ms delay. If the chunk loads faster than 300ms, users see nothing (no blink).

| File | Change |
|------|--------|
| `src/components/PageLoader.tsx` | Add `DelayedLoader` component with 300ms delay using `useState` + `useEffect` |
| `src/App.tsx` | Wrap Suspense fallbacks with `DelayedLoader` instead of raw `PageLoader`/`InlinePageLoader` |

```tsx
// DelayedLoader — renders nothing for first 300ms, then shows loader
function DelayedLoader({ children, delay = 300 }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show ? children : null;
}
```

### Task 2: Optimize Frontend Speed

**Current state:** Already has code splitting, stale times, and lazy loading. Key improvement: preload critical route chunks on hover.

| Optimization | Change |
|------|--------|
| Route preloading | Add `onMouseEnter` preload triggers to main nav links for Properties, Developers, Areas |
| QueryClient tuning | Increase `staleTime` to 10min for listing data (currently 5min) |
| Image loading | Add `loading="lazy"` and `decoding="async"` to non-hero images in BrandedLoader |

Files: `src/components/PageLoader.tsx` (add decoding async), `src/App.tsx` (QueryClient staleTime bump)

### Task 3: Fix Listing Admin Card Spacing

**Issue:** `<main>` content at line 760 starts immediately after the sticky header with no top padding.

**Fix:** Add `pt-6` to the `<main>` element in `ListingAdmin.tsx` (line 760).

| File | Change |
|------|--------|
| `src/pages/ListingAdmin.tsx` L760 | Change `<main className="min-h-[calc(100vh-220px)] overflow-y-auto pb-12">` → add `pt-6` |

### Task 4: Deploy Edge Functions

Use the deploy tool to deploy all edge functions. There are 200+ functions — will deploy in bulk.

### Files Summary

| File | Change |
|------|--------|
| `src/components/PageLoader.tsx` | Add `DelayedLoader` wrapper, add `decoding="async"` to loader images |
| `src/App.tsx` | Use `DelayedLoader` in Suspense fallbacks, bump staleTime to 10min |
| `src/pages/ListingAdmin.tsx` | Add `pt-6` to main content area |
| Edge functions | Bulk deploy all functions |

### Implementation Order
1. Fix `PageLoader.tsx` with delayed rendering (Task 1 + 2)
2. Update `App.tsx` Suspense fallbacks and staleTime (Task 1 + 2)
3. Add padding to `ListingAdmin.tsx` (Task 3)
4. Deploy edge functions (Task 4)

