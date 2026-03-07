

# Fix: Section Navigation Should Center the Target Section

## Problem
When clicking tabs like "Units" or "Amenities" in the sticky header, the section scrolls to the **top** of the viewport (`block: "start"` with `scroll-mt-40`). The user wants clicked sections to be **centered** on screen.

## Root Cause
In `ProjectDetailLayout.tsx` line 375:
```ts
ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
```
This aligns the section's top edge to the viewport top (offset by `scroll-mt-40`). The result is the section title barely visible at top, with content from previous sections still filling the upper half.

## Fix

**In `ProjectDetailLayout.tsx`** — Change `scrollToRef` to use `block: "center"`:
```ts
const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
  ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
};
```

This single change makes every section scroll to the **vertical center** of the viewport when its tab is clicked. The `scroll-mt-40` class on each section div can remain as a fallback for browser hash navigation but won't affect `block: "center"`.

## Files to Modify
1. **`src/components/project-detail/ProjectDetailLayout.tsx`** — Line 375: change `block: "start"` → `block: "center"`

