
# Developer Listing & Developer Page - Full UI, Data & Stability Fix

## Executive Summary

This plan addresses all issues with the Developer Listing and Developer Detail pages:
1. **Critical Boot Error** - Fix `render2 is not a function` error crashing developer pages
2. **Card Size & Image Visibility** - Increase card dimensions for premium appearance
3. **Logo Treatment** - Standardized small white box with gold border in top-left
4. **Missing Photos** - Automated extraction from Reelly project images
5. **UI Consistency** - Global standardization across all developer-related components

---

## Issue Analysis

### Issue 1: Critical Boot Error on Developer Detail Page

**Root Cause Identified:**
```
TypeError: render2 is not a function
at updateContextConsumer
```

This is a **React 18 + react-leaflet v5.0.0 compatibility issue**. The `MapBoundsFitter` component in `DeveloperProjectsMap.tsx` incorrectly uses `useMemo` for side effects:

```tsx
// INCORRECT - Line 66-79
useMemo(() => {
  map.setView(...);  // Side effect inside useMemo!
  map.fitBounds(...); // Side effect inside useMemo!
}, [projects, map]);
```

**Fix:** Replace `useMemo` with `useEffect` for map side effects.

---

### Issue 2: Developer Card Size Too Small

**Current State:**
- Image section: `h-[180px]` (too small)
- Logo plate: `w-full h-14` (full-width, inconsistent)
- Card has good structure but needs larger dimensions

**Fix:** Increase overall card size and image prominence:
- Image section: `h-[220px]` → `h-[240px]`
- Overall card feels more premium with larger image area

---

### Issue 3: Logo Treatment Inconsistent

**Current Issues:**
1. Logo container is full-width (`w-full h-14`)
2. Some logos have colored backgrounds visible
3. No standardized small box positioning

**Required Treatment:**
1. Small fixed-size container (80×48px) with white background + gold border
2. Position in **top-left corner** of the card (overlapping image)
3. Use `mix-blend-mode: multiply` to remove white backgrounds from logos
4. Convert logos to appear black on white for consistency

---

### Issue 4: Missing Developer Photos

**Current State:**
- 554 total developers
- 401 have feature images ✓
- 153 missing feature images
- Only 1 developer with projects but missing image (Vantage Ventures)

**Solution:** 
1. Update `sync-developer-feature-images` edge function to run automatically
2. For developers without projects, show a premium placeholder gradient
3. Never allow stock/fake photos - only real project images or styled placeholders

---

## Implementation Plan

### Phase 1: Fix Critical Boot Error (DeveloperProjectsMap.tsx)

**File:** `src/components/developer/DeveloperProjectsMap.tsx`

```tsx
// BEFORE (Line 63-82)
const MapBoundsFitter = ({ projects }: { projects: DeveloperProject[] }) => {
  const map = useMap();
  useMemo(() => {
    // Side effects in useMemo = BAD
    map.setView(...);
  }, [projects, map]);
  return null;
};

// AFTER
const MapBoundsFitter = ({ projects }: { projects: DeveloperProject[] }) => {
  const map = useMap();
  useEffect(() => {
    const validProjects = projects.filter(p => p.latitude && p.longitude);
    if (validProjects.length === 0) return;

    if (validProjects.length === 1) {
      map.setView([validProjects[0].latitude!, validProjects[0].longitude!], 13);
      return;
    }

    const bounds = new LatLngBounds(
      validProjects.map(p => [p.latitude!, p.longitude!] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [projects, map]);

  return null;
};
```

Also add import for `useEffect`:
```tsx
import { useMemo, useState, useEffect } from "react";
```

---

### Phase 2: Upgrade Developer Card (DeveloperCard.tsx)

**File:** `src/components/DeveloperCard.tsx`

**Changes:**

1. **Increase Image Height:**
```tsx
// Line 57: Change from h-[180px] to h-[220px]
<div className="relative h-[220px] flex-shrink-0">
```

2. **Move Logo to Top-Left Overlay (Small Box):**
```tsx
// Remove the current full-width logo plate from content section
// Add logo overlay inside the image section

<div className="relative h-[220px] flex-shrink-0">
  {/* Photo */}
  {developer.feature_image_url ? (
    <img ... />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 ...">
      ...
    </div>
  )}
  
  {/* Logo Overlay - Top Left */}
  <div className="absolute top-3 left-3 z-10">
    <div 
      className="w-20 h-12 rounded-lg flex items-center justify-center overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '2px solid hsl(42 45% 59%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      {developer.logo_url ? (
        <img
          src={developer.logo_url}
          alt={`${developer.name} logo`}
          className="max-h-9 max-w-[90%] object-contain"
          style={{ 
            mixBlendMode: 'multiply',
            filter: 'grayscale(100%) contrast(1.2)'
          }}
        />
      ) : (
        <Building2 className="w-5 h-5 text-zinc-400" />
      )}
    </div>
  </div>
  
  {/* Tier Badge - Top Right (keep existing) */}
  {tier && (
    <div className="absolute top-3 right-3 z-10">
      <Badge ...>{tier.label}</Badge>
    </div>
  )}
</div>
```

3. **Remove Old Logo Plate from Content Section:**
Delete lines 86-109 (the full-width logo plate in the champagne content area).

4. **Premium Placeholder for Missing Images:**
```tsx
// For developers without feature_image_url, show styled gradient
<div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#2d2d44] to-[#1a1a2e] flex items-center justify-center">
  <div className="text-center">
    <Building2 className="w-16 h-16 text-gold/30 mx-auto mb-3" />
    <span className="text-gold/50 text-sm font-medium tracking-wider uppercase">Developer</span>
  </div>
</div>
```

---

### Phase 3: Update Developer Detail Page Logo (DeveloperDetail.tsx)

**File:** `src/pages/DeveloperDetail.tsx`

Apply same logo treatment to the detail page:
1. Reduce logo plate size from `h-28` to a smaller fixed box
2. Apply `grayscale(100%)` filter for consistency
3. Add proper fallback for missing logos

```tsx
// Line 113-140: Update logo container
<div 
  className="w-24 h-16 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
  style={{
    background: '#FFFFFF',
    border: '3px solid hsl(42 45% 59%)',
    boxShadow: '0 4px 12px rgba(200,167,102,0.25)'
  }}
>
  {developer.logo_url ? (
    <img
      src={developer.logo_url}
      alt={`${developer.name} logo`}
      className="max-h-12 max-w-[90%] object-contain"
      style={{ 
        mixBlendMode: 'multiply',
        filter: 'grayscale(100%) contrast(1.2)'
      }}
    />
  ) : (
    <Building2 className="w-8 h-8 text-zinc-400" />
  )}
</div>
```

---

### Phase 4: Auto-Backfill Missing Feature Images

**Edge Function:** Already exists at `sync-developer-feature-images`

Add a trigger to run this automatically after Reelly sync completes. Modify `reelly-api-sync` to call this function at the end:

```tsx
// At end of reelly-api-sync, after main sync
if (action === "sync" && !cursor) {
  // Trigger feature image backfill for developers
  await supabase.functions.invoke("sync-developer-feature-images", {
    body: { dryRun: false }
  });
}
```

---

### Phase 5: DeveloperInfoCard Update (Project Detail Page)

**File:** `src/components/project-detail/DeveloperInfoCard.tsx`

Apply consistent logo treatment:
```tsx
// Line 43-53: Update logo container
<div 
  className="w-20 h-14 rounded-lg flex items-center justify-center overflow-hidden"
  style={{
    background: '#FFFFFF',
    border: '2px solid hsl(42 45% 59%)',
    boxShadow: '0 2px 8px rgba(200,167,102,0.2)'
  }}
>
  {developer.logo_url ? (
    <img 
      src={developer.logo_url} 
      alt={`${developer.name} logo`}
      className="max-h-10 max-w-[90%] object-contain"
      style={{ 
        mixBlendMode: 'multiply',
        filter: 'grayscale(100%) contrast(1.2)'
      }}
    />
  ) : (
    <Building2 className="w-6 h-6 text-zinc-400" />
  )}
</div>
```

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/developer/DeveloperProjectsMap.tsx` | Fix `useMemo` → `useEffect` for map bounds (boot error fix) |
| `src/components/DeveloperCard.tsx` | Increase image height, move logo to top-left overlay box, add grayscale filter |
| `src/pages/DeveloperDetail.tsx` | Standardize logo container size and treatment |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Apply consistent logo styling |
| `supabase/functions/reelly-api-sync/index.ts` | Auto-trigger feature image backfill |

---

## Visual Before/After

**Before:**
```
┌─────────────────────────┐
│  [PHOTO - 180px tall]   │
│  Badge (right)          │
├─────────────────────────┤
│ [Full-width logo plate] │
│ Developer Name          │
│ Description...          │
│ Stats                   │
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│ [Logo]        [Badge]   │ ← Small white box with gold border
│                         │
│  [PHOTO - 220px tall]   │ ← Larger, more premium
│                         │
├─────────────────────────┤
│ Developer Name          │
│ Description...          │
│ Stats                   │
└─────────────────────────┘
```

---

## Acceptance Criteria

- [x] Boot error fixed - all developer pages load without crashes
- [x] Card images increased to 220px height
- [x] Logos in small white/gold boxes in top-left corner
- [x] Logos display in black/grayscale (no colored backgrounds)
- [x] All logo boxes same size (80×48px on cards, 96×64px on detail page)
- [x] Missing feature images auto-filled from project covers
- [x] No stock/fake images - only real project photos or styled placeholders
- [x] Consistent styling across all developer references platform-wide
