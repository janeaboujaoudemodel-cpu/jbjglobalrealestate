

## Fix: Sticky Filter Bar — Ref-Switching Bug + Placeholder Height Failure

### Root Cause (confirmed via code analysis and live testing)

There are **two bugs** causing the filter bar to show as just a thin champagne line instead of the full bar:

**Bug 1: barRef switches between two elements, causing height measurement to fail**

The `barRef` is conditionally assigned to EITHER the inline bar (when `!isFixed`) OR the portal bar (when `isFixed`). When `isFixed` transitions from false to true:
1. The inline bar (which had `barRef`) gets unmounted
2. The portal bar (which gets `barRef`) hasn't rendered yet
3. The placeholder height calculation `barRef.current?.offsetHeight ?? 0` evaluates to **0** because the ref is momentarily null

Result: the placeholder collapses to 0px height, and the portal bar renders with 0 height context.

**Bug 2: Conditional rendering destroys and recreates the filter bar**

Using `{!isFixed && ...}` and `{isFixed && ...}` means React fully unmounts and remounts the bar content on every toggle. This causes flickering and the "thin line" effect the user sees — the bar border-bottom renders before the content mounts inside it.

### Fix (single file: `src/components/area-detail/AreaProjectsGrid.tsx`)

**Strategy: Always render the bar inline. Measure its height once. When fixed, ALSO render a portal copy. Hide the inline version with `opacity: 0` (keeps it in the DOM for measurement).**

1. Add a `barHeight` state variable, initialized to 0
2. Add a `useEffect` that measures `barRef.current?.offsetHeight` on first render and stores it in `barHeight`
3. Always render the inline bar (remove the `{!isFixed && ...}` conditional), but when `isFixed` is true, give it `opacity: 0` and `pointer-events: none` so it's invisible but still in the DOM for measurement
4. When `isFixed` is true, also render the portal version (keep existing portal code)
5. The placeholder uses `barHeight` (the stored number) instead of `barRef.current?.offsetHeight` — this is stable and won't be 0

**Specific line changes:**

- Line 24: Add `const [barHeight, setBarHeight] = useState(0);`
- After the IntersectionObserver useEffect, add a new useEffect to measure barRef height:
  ```
  useEffect(() => {
    if (barRef.current) {
      setBarHeight(barRef.current.offsetHeight);
    }
  }, [hasProjects]);
  ```
- Line 263: Change placeholder height from `barRef.current?.offsetHeight ?? 0` to `barHeight`
- Lines 266-275: Remove the `{!isFixed && ...}` conditional. Always render the inline bar, but add `style={{ opacity: isFixed ? 0 : 1, pointerEvents: isFixed ? 'none' : 'auto' }}` to make it invisible when the portal is active
- Lines 278-288: Keep the portal rendering as-is (only when `isFixed` is true), but remove the `ref={barRef}` from the portal version since the inline version always has it

This ensures:
- The `barRef` always points to the same inline DOM element (never switches)
- The bar height is measured once and stored stably
- The portal renders the full bar content without any measurement dependency
- No flicker, no thin line — the portal appears fully rendered instantly
