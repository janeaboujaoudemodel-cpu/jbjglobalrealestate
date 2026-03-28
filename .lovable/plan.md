

# Fix Logo on White Background During Page Load

## Root Cause
The `InlinePageLoader` component (used as Suspense fallback for ALL routes) renders `BrandedLoader variant="light"` inside a container with **no background color**. This means the monogram appears on the browser's default white background, making it look like the logo has a white background box. This is what you see every time you refresh.

## Fix

### 1. Change `InlinePageLoader` to use dark background
**File**: `src/components/PageLoader.tsx`
- Add the app's standard dark gradient background to the `InlinePageLoader` container
- Switch from `variant="light"` to default `variant="dark"` so the light/gold monogram renders on the dark background
- This matches the full-page `PageLoader` which already uses the dark gradient

### 2. Add dark background to `index.html` body
**File**: `index.html`
- Set `background-color` on `<body>` to the app's dark color (`#1a1510`) so the very first paint is dark — no white flash before React mounts

## What stays the same
- All other components, layout, design, and UX remain identical
- Only the loading state background changes from white to the app's standard dark theme

