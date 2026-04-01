

## Fix: Stable "Continue Searching" Section + Guaranteed Property Images

### Problem 1: Section disappears when no history
Line 90-93 in `ContinueSearching.tsx` returns `null` when there are no items. The section completely unmounts, causing layout instability.

### Problem 2: Broken images still show
The `Image()` preload check in `RecentCard3D` tries to self-heal but the fetched URL may also be broken, or the fetch may fail silently, leaving a broken state.

---

### Changes

**File: `src/components/ContinueSearching.tsx`**

1. **Always render the section** — remove the early `return null` guards. When there are no items, show an empty state: "You haven't viewed any properties yet. Start exploring now!" with a CTA link to `/properties`.

2. **Fallback gradient for broken images** — the current fallback (icon on dark gradient) is already in place, but the `imgBroken` state can flicker. Fix by:
   - Defaulting `imgBroken` to `true` when `imageUrl` is falsy/invalid (contains `undefined`, `null` string, or doesn't start with `http`)
   - Adding `onError` directly on the `background-image` div isn't possible, so keep the `Image()` preload but add a guard: if the fetched URL from DB is the same as the broken one, don't re-fetch (prevent infinite loop)
   - Add a `fetchAttempted` ref to prevent repeated DB calls for the same item

3. **Validate imageUrl before preload** — skip the `Image()` check if the URL contains `"undefined"`, `"null"`, or doesn't start with `http`.

### Technical Detail

```text
Current flow:
  items.length === 0 → return null (section gone)

New flow:
  items.length === 0 → render empty state card with CTA
  items.length > 0   → render carousel as before

Image recovery:
  - Add fetchAttempted ref to prevent infinite re-fetch loops
  - Validate URL format before attempting Image() preload
  - If DB returns same URL that was broken, accept fallback gradient
```

**Single file change**: `src/components/ContinueSearching.tsx`

