

# Fix Map Page Layout — Eliminate Gap Between Header and Map

## Root Cause

The `<main>` element in MainLayout (line 271) applies `pt-[88px]` top padding to push content below the fixed header. The PropertyMap page then has a `min-h-screen relative` wrapper followed by a `sticky top-[88px]` toolbar. This creates the visible gap: the 88px padding shows the page background (`md:bg-[#E8DCC8]`) as an empty beige band before any PropertyMap content renders. The sticky toolbar then appears as a second strip, and the map's `calc(100vh - 88px - 48px)` height doesn't account for this padding, making the map too tall and partially hidden.

## Fix: Flexbox Column Layout (No Sticky, No Calc Guessing)

Replace the entire PropertyMap return structure with a simple flex column that:
1. Uses **negative top margin** (`-mt-[88px] pt-[88px]`) — not needed. Better: use `h-[calc(100vh-88px)]` flex column with `overflow-hidden` so the entire page fits exactly in the viewport below the header.
2. Toolbar is a `shrink-0` flex child — no sticky, no top offset. It naturally sits at the top of the content area (right below the header).
3. Map is a `flex-1 relative overflow-hidden` child — fills all remaining space. No hardcoded height calc.

This eliminates: sticky positioning, manual height calculations, and any possibility of gaps.

## Changes to `src/pages/PropertyMap.tsx`

### Outer wrapper (line 199)
Change from:
```tsx
<div className="min-h-screen relative">
```
To:
```tsx
<div className="flex flex-col h-[calc(100vh-88px)] overflow-hidden">
```

### Toolbar (line 201)
Change from:
```tsx
<div className="sticky top-[88px] z-[60] bg-gradient-to-r from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8] border-b border-gold/20">
```
To:
```tsx
<div className="shrink-0 z-10 bg-gradient-to-r from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8] border-b border-gold/20">
```
- Removed `sticky top-[88px]` — not needed in flex layout, it's naturally at top
- Reduced z-index to `10` (only needs to beat map internals)

### Map container (line 260)
Change from:
```tsx
<div style={{ height: "calc(100vh - 88px - 48px)" }}>
```
To:
```tsx
<div className="flex-1 relative overflow-hidden">
```
- Fills remaining flex space automatically — no manual height calc

### List/Grid panel (line 317)
Change `top-[136px]` to `top-[88px]` and compute height from there, OR better: keep it as a sibling inside the flex layout. Since it's `fixed` positioned, change:
```tsx
<div className="fixed top-[136px] right-0 bottom-0 ...">
```
To use the correct offset. The header is 88px, toolbar is ~44px, so `top-[132px]` is approximately right. But since we're removing sticky and using flex, the toolbar is no longer fixed — so the panel should overlay from the toolbar height down. Keep `fixed top-[132px]` (88px header + ~44px toolbar).

## Summary of changes

| Line | From | To |
|------|------|----|
| 199 | `min-h-screen relative` | `flex flex-col h-[calc(100vh-88px)] overflow-hidden` |
| 201 | `sticky top-[88px] z-[60]` | `shrink-0 z-10` |
| 260 | `style={{ height: "calc(100vh - 88px - 48px)" }}` | `className="flex-1 relative overflow-hidden"` + remove inline style |
| 317 | `top-[136px]` | `top-[132px]` |

### File: `src/pages/PropertyMap.tsx` — only file modified

