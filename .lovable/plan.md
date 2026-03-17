

## SESSION 5 — Global Scroll Performance Optimization

### Current State Analysis

**Existing optimizations already in place:**
- `scroll-behavior: smooth` in global CSS with `prefers-reduced-motion` fallback
- `-webkit-overflow-scrolling: touch` on body
- `will-change-transform` on marquee/ticker elements
- Lazy loading with `Suspense` for below-fold sections on homepage
- `requestIdleCallback` preloading of near-fold chunks
- `once: true` on all `whileInView` animations (no re-triggering)

**Performance bottlenecks identified:**

1. **2,000+ framer-motion `whileInView` observers across 114 files** — Each creates an IntersectionObserver. On long pages like Index.tsx, dozens are active simultaneously, causing layout recalculations during scroll.

2. **No CSS `content-visibility: auto`** — Offscreen sections are fully rendered and laid out, consuming GPU/paint resources during scroll even when invisible.

3. **Large blur elements (`blur-[80px]`, `blur-[120px]`)** — Multiple sections have decorative blur orbs that trigger expensive GPU compositing layers on every repaint. These are NOT promoted to their own layers.

4. **Missing `transform-gpu` / `will-change` on fixed/sticky elements** — The sticky BrokerToolkitNavigation and other fixed headers lack GPU layer promotion, causing repaints during scroll.

5. **No passive scroll listeners declared in components** — `PageNavigation.tsx` adds scroll listener with `{ passive: true }` (good), but framer-motion's internal observers don't use passive.

### Plan — Targeted Performance Fixes

#### Fix 1: Add `content-visibility: auto` to offscreen sections
**File: `src/index.css`**
Add a utility class `.cv-auto` that applies `content-visibility: auto; contain-intrinsic-size: auto 500px;` — this tells the browser to skip rendering offscreen sections entirely, dramatically reducing paint and layout costs during scroll.

#### Fix 2: GPU-promote blur orbs and decorative layers
**File: `src/index.css`**
Add a global rule for elements with large `blur-` classes to use `transform: translateZ(0)` (GPU layer promotion), preventing blur recalculation during scroll compositing.

#### Fix 3: Add `transform-gpu` to sticky/fixed navigation elements
**Files:**
- `src/components/broker-toolkit/BrokerToolkitNavigation.tsx` — add `transform-gpu` to sticky nav
- `src/components/PageNavigation.tsx` — add `transform-gpu` to the fixed floating button

#### Fix 4: Apply `content-visibility: auto` to homepage lazy sections
**File: `src/pages/Index.tsx`**
Wrap each `<Suspense>` block's parent `<section>` / `<div>` with the `.cv-auto` class. This means the browser skips layout/paint for sections far below the viewport.

#### Fix 5: Optimize framer-motion `viewport.margin` for early trigger
**Multiple files** — Ensure all `whileInView` animations use `margin: "-100px"` so animations trigger early (before the element is visible), preventing visible "pop-in" during fast scrolling. Currently, many use `-50px` or no margin.

### Files Modified
1. `src/index.css` — Add `.cv-auto` utility class + blur GPU promotion rule (~10 lines)
2. `src/pages/Index.tsx` — Add `cv-auto` class to ~15 section wrappers
3. `src/components/broker-toolkit/BrokerToolkitNavigation.tsx` — Add `transform-gpu`
4. `src/components/PageNavigation.tsx` — Add `transform-gpu` to fixed container

### NOT Changing
- Individual component animation variants (too many files, all use `once: true` which is correct)
- Scroll utility functions in `src/lib/scroll.ts` (already optimized)
- Lazy loading strategy (already well-structured)

### Route
- `/` (Homepage — primary beneficiary)
- All pages benefit from the CSS-level fixes

### Testing Steps
1. Open homepage on desktop, scroll through all sections — verify no jank
2. Open DevTools Performance tab, record a full-page scroll — verify no long tasks > 50ms
3. Test on mobile viewport (375px) — verify smooth touch scrolling
4. Test on tablet viewport (768px) — verify smooth scrolling
5. Verify animations still trigger correctly with `content-visibility: auto`

