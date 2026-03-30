

# Fix Map Control Bar Position — Remove Gap, No Overlay

## Root Cause

The control bar uses `sticky top-[88px]` with `bg-[#FAF9F6]` (near-white), which creates a visible color break from the champagne header above. The map height calculation `calc(100vh - 88px - 48px)` is correct structurally, but the visual gap comes from the background mismatch and the sticky behavior making it appear to float.

## Changes

### 1. PropertyMap.tsx — Control bar fixes

**Background**: Change `bg-[#FAF9F6]` to match the header's champagne family: `bg-gradient-to-r from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8]`. This makes the control bar visually merge with the header — no visible gap or color break.

**Border**: Remove `border-b border-border/50` (creates visible separation). Replace with `border-b border-gold/20` to match the header's bottom border style — seamless transition.

**Shadow**: Remove `shadow-sm` — the header already has a shadow, adding another creates a double-line effect.

**Position**: Keep `sticky top-[88px] z-[60]` — this is structurally correct (it's a normal-flow sibling, not inside the map container). The sticky ensures it stays visible when scrolling the list/grid panels.

**Map height**: Keep `calc(100vh - 88px - 48px)` — accounts for header (88px) + control bar (~48px).

### 2. Specific line changes in PropertyMap.tsx

Line 201 — change:
```
bg-[#FAF9F6] border-b border-border/50 shadow-sm
```
to:
```
bg-gradient-to-r from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8] border-b border-gold/20
```

This single change eliminates the visible gap by making the control bar blend seamlessly with the header above it.

### Files to modify
- `src/pages/PropertyMap.tsx` — line 201 only (background + border classes)

