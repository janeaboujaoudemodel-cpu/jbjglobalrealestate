## What's happening

The "We're getting things ready" screen with the Refresh / Go to Homepage buttons is **not a loading screen** — it's the top-level error boundary (`src/components/AppErrorBoundary.tsx`) catching a thrown error in the React tree and showing its visible fallback card.

Today the boundary only silently retries when the error message matches a narrow list of "chunk / dynamic import" keywords. Any other transient render error (a race during route transition, a lazy component throwing during Suspense, a one-shot hook error, etc.) skips the silent-retry path and immediately renders the visible card — which is exactly the bug you're seeing on the homepage.

## Fix

Make the boundary silently retry **any** error a few times before ever showing the visible card. Users should never see this fallback unless the app has truly failed multiple times in a row.

### Changes to `src/components/AppErrorBoundary.tsx`

1. In `componentDidCatch`:
   - Always silently retry (clear `hasError`, increment `retryCount`) up to 3 times for any error, not just chunk errors.
   - Keep the existing behavior of triggering a `window.location.reload()` after 2.5s **only** when the message looks like a chunk/network failure. For non-chunk errors, just remount the tree without a hard reload.

2. In `render`:
   - While `retryCount < 3`, return `null` instead of the fallback card — no visible flash for transient errors.
   - Only render the visible "We're getting things ready" card after the boundary has been hit 3+ times in a row, which indicates a genuine, persistent failure.

### Why this fixes the screenshot

The boundary will no longer flash the card for one-off render errors during route changes, lazy chunk loads, or hydration hiccups. The homepage will simply remount silently and recover.

No other files are touched. The card itself is preserved as a true last-resort safety net (after 3 consecutive failures), so we are not removing the feature — just preventing it from triggering on transient issues.
