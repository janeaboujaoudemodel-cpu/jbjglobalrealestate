
# Move Sale Status Labels to Top-Left Corner

## Summary

This change will ensure all sale status labels (On Sale, Sold Out, Announced, Presale, etc.) are consistently positioned in the **top-left corner** of all property/project listing cards across the platform.

## Current State

| Component | Sale Status Badge Position | Other Top-Left Content |
|-----------|---------------------------|------------------------|
| `ProjectCard.tsx` | Bottom-left | Developer logo or property type |
| `ReellyProjectCard.tsx` | Top-right | None |
| `FeaturedListings.tsx` | Top-left (purpose badge) | Already correct |
| `PortfolioAssetCard.tsx` | Top-left (objective badge) | Already has content |

## Proposed Changes

### 1. `ProjectCard.tsx`
- Move the sale status badge from `bottom-3 left-3` to `top-3 left-3`
- Stack it below the developer logo if present (add vertical offset)
- If no developer logo, place it at absolute top-left

**Before:**
```tsx
{/* Bottom-Left: Sale Status Badge */}
{saleStatusBadge && !project.is_sold_out && (
  <div className={`absolute bottom-3 left-3 z-10 px-2.5 py-1 ...`}>
```

**After:**
```tsx
{/* Top-Left: Sale Status Badge (below developer logo if present) */}
{saleStatusBadge && !project.is_sold_out && (
  <div className={`absolute ${developerHasLogo ? 'top-16' : 'top-3'} left-3 z-10 px-2.5 py-1 ...`}>
```

### 2. `ReellyProjectCard.tsx`
- Move sale status badge from `top-3 right-3` to `top-3 left-3`
- This makes it consistent with the main ProjectCard

**Before:**
```tsx
{/* Top-Right: Sale Status Badge */}
{saleStatusBadge && (
  <div className={`absolute top-3 right-3 z-10 ...`}>
```

**After:**
```tsx
{/* Top-Left: Sale Status Badge */}
{saleStatusBadge && (
  <div className={`absolute top-3 left-3 z-10 ...`}>
```

### 3. Additional Considerations

**Conflict Resolution:**
- In `ProjectCard.tsx`, if both developer logo AND sale status exist, the status badge will be positioned below the logo (`top-16`) to avoid overlap
- If only property type label exists (no logo), the sale status will take priority at `top-3`
- The Sold Out badge currently at top-right will also move to top-left for consistency

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ProjectCard.tsx` | Move sale status from bottom-left to top-left, handle logo conflict |
| `src/components/ReellyProjectCard.tsx` | Move sale status from top-right to top-left |

## Visual Layout After Change

```
+----------------------------------+
| [Status]  [Logo?]    [Fav] [Pin] |  <- Status in top-left corner
|                                  |
|           [Image]                |
|                                  |
|                      [Handover]  |  <- Handover stays bottom-right
+----------------------------------+
| Project Name                     |
| Location                         |
| Price | Developer                |
| [Email] [Call] [WhatsApp]        |
+----------------------------------+
```

## Implementation Notes

- The sale status badge styling remains unchanged (colors: emerald for On Sale, red for Sold Out, gold for Announced, amber for Presale)
- Z-index will be maintained at `z-10` to stay above the image but below favorite buttons
- The property type label will be hidden when sale status is present to avoid clutter
