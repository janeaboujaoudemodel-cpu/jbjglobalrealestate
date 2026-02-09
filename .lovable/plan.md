
# Comprehensive Project Detail Page & Data Fixes

## ✅ IMPLEMENTATION STATUS: COMPLETE

UI fixes have been implemented. Next step: Run full data backfill.

## Problem Summary (RESOLVED)
1. **Missing Photos**: Only 1 image per project (the cover) instead of full gallery
2. **Missing Amenities**: `amenities` is NULL for most projects
3. **Missing Floor Plans**: `floor_plan_types` is NULL
4. **Missing Payment Plan**: `payment_plan` and `payment_breakdown` are NULL
5. **Missing Bedroom Data**: `bedrooms_min`/`bedrooms_max` are NULL
6. **Missing Size Data**: `size_min`/`size_max` are NULL
7. **Wrong Floor Count**: `floors` shows 1 (building_count) instead of actual floors

### UI Display Issues
1. **"View Details" fallback**: Showing when bedroom/size data is NULL
2. **"On Request" for price**: Showing when `price_from` is NULL
3. **Developer logos not fitting**: Logos appear cropped inside the card container

---

## Root Cause Analysis

The database query reveals the core problem:

| Project | Images | Docs | Price | Bedrooms | Amenities | Floor Plans |
|---------|--------|------|-------|----------|-----------|-------------|
| Woodland Residences | 1 | 0 | NULL | NULL | NULL | NULL |
| Woodland Crest | 1 | 0 | ✓ | NULL | NULL | NULL |
| Ritz-Carlton | 1 | ? | ✓ | NULL | NULL | NULL |

**The Reelly API sync only captured basic project info (cover image, name, price), but the DETAIL BACKFILL was never run successfully** to populate:
- Gallery images (beyond cover)
- Amenities list
- Floor plans
- Unit types (bedrooms)
- Payment plans
- Documents/brochures

---

## Solution: Two-Phase Fix

### Phase 1: Force Full Data Backfill (Backend)

The `reelly-backfill-projects` edge function exists but needs to be run on ALL projects to fetch the complete detail data from the Reelly API.

**Actions Required:**
1. Call the backfill function with `force_refresh: true` to overwrite ALL projects
2. This will fetch: gallery images, amenities, floor plans, unit types, documents, payment plans

### Phase 2: UI Improvements (Frontend)

Fix the display components to:
1. Never show "View Details" - show actual data or "TBA"
2. Never show "On Request" - show actual price or "Price TBA"
3. Fix developer logo containers for full-fit display

---

## Technical Changes

### 1. Fix Quick Stats Card Display (Lines 575-598)

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

Current code shows "View Details" as fallback:
```tsx
{bedroomsText || "View Details"}
{sizeText || "View Details"}
```

Change to show proper "TBA" or derive from unit_types:

```tsx
// Bedrooms card
<p className="mt-2 text-xl font-bold text-foreground">
  {bedroomsText || (project.unit_types?.length ? 
    deriveBedroomsFromUnitTypes(project.unit_types) : 
    "TBA")}
</p>

// Size card
<p className="mt-2 text-xl font-bold text-foreground">
  {sizeText || (project.unit_types?.length ? 
    deriveSizeFromUnitTypes(project.unit_types) : 
    "TBA")}
</p>

// Price card - never show "On request", show "Price TBA"
<p className="mt-2 text-xl font-bold text-gold">
  {typeof project.price_from === "number" && project.price_from > 0 
    ? formatPriceUtil(project.price_from) 
    : "Price TBA"}
</p>
```

### 2. Add Helper Functions for Unit Type Derivation

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

Add functions to extract bedroom/size info from unit_types when min/max are null:

```tsx
// Derive bedroom range from unit_types array
const deriveBedroomsFromUnitTypes = (unitTypes: ProjectDetailData['unit_types']): string | null => {
  if (!unitTypes || unitTypes.length === 0) return null;
  
  const types = unitTypes.map(u => u.type?.toLowerCase() || '');
  const hasStudio = types.some(t => t.includes('studio'));
  const brMatches = types.flatMap(t => {
    const match = t.match(/(\d+)\s*(?:br|bed|bedroom)/i);
    return match ? [parseInt(match[1])] : [];
  });
  
  if (brMatches.length === 0 && hasStudio) return 'Studio';
  if (brMatches.length === 0) return null;
  
  const minBr = Math.min(...brMatches);
  const maxBr = Math.max(...brMatches);
  
  if (hasStudio) return minBr === maxBr ? `Studio - ${maxBr} BR` : `Studio - ${maxBr} BR`;
  if (minBr === maxBr) return `${minBr} BR`;
  return `${minBr} - ${maxBr} BR`;
};

// Derive size range from unit_types array
const deriveSizeFromUnitTypes = (unitTypes: ProjectDetailData['unit_types']): string | null => {
  if (!unitTypes || unitTypes.length === 0) return null;
  
  const sizes = unitTypes.flatMap(u => [u.size_from, u.size_to].filter(Boolean)) as number[];
  if (sizes.length === 0) return null;
  
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  
  if (minSize === maxSize) return `${minSize.toLocaleString()} sqft`;
  return `${minSize.toLocaleString()} - ${maxSize.toLocaleString()} sqft`;
};
```

### 3. Fix HouseDetailsSection Wrong Floor Display

**File: `src/components/project-detail/HouseDetailsSection.tsx`**

The Reelly API returns `building_count` (number of buildings) which is being stored in `floors` field incorrectly. The UI should clarify this:

```tsx
// Change label based on value context
if (floors && floors > 0) {
  // If floors is 1-3, it's likely building_count, not floor count
  if (floors <= 3) {
    details.push({ 
      icon: Building2, 
      label: "Buildings", 
      value: `${floors} Building${floors > 1 ? 's' : ''}` 
    });
  } else {
    details.push({ 
      icon: Layers, 
      label: "Number of Floors", 
      value: `${floors} Floors` 
    });
  }
}
```

### 4. Fix Developer Logo in DeveloperInfoCard (Inner Cards)

**File: `src/components/project-detail/DeveloperInfoCard.tsx`**

Current (line 56-73): Logo uses `object-contain` but container is too small.
Already has `w-44 h-28` which is good, but ensure padding and sizing work:

```tsx
<div 
  className="w-48 h-32 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
  style={{
    background: '#FFFFFF',
    border: '3px solid hsl(42 45% 59%)',
    boxShadow: '0 4px 16px rgba(200,167,102,0.3)'
  }}
>
  {developer.logo_url ? (
    <img 
      src={developer.logo_url} 
      alt={`${developer.name} logo`}
      className="w-full h-full object-contain p-4"
    />
  ) : (
    <Building2 className="w-12 h-12 text-zinc-400" />
  )}
</div>
```

### 5. Ensure All Sections Show (Visibility Logic Fix)

**File: `src/components/project-detail/ProjectDetailLayout.tsx`**

The `visibleTabs` logic hides sections when data is null. After backfill, this will auto-show. But we should also ensure Payment Plan section shows if there's ANY payment info:

```tsx
const hasPayment = !!project.payment_plan || 
                   paymentPlanDocs.length > 0 || 
                   !!project.payment_breakdown ||
                   !!project.down_payment_percent;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/project-detail/ProjectDetailLayout.tsx` | Fix "View Details"/"On Request" fallbacks, add unit type derivation helpers |
| `src/components/project-detail/HouseDetailsSection.tsx` | Fix floor count label logic |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Increase logo container size, improve padding |

---

## Data Backfill Required

After the code fixes, a manual backfill must be run to populate the missing data from the Reelly API:

```bash
# Call the backfill function with force_refresh to get ALL data
POST /functions/v1/reelly-backfill-projects
{
  "mode": "all",
  "force_refresh": true,
  "batch_size": 50
}
```

This will:
1. Fetch each project's full details from the Reelly API
2. Update: price, size, bedrooms (from unit_types), amenities, floor plans, documents, gallery images, payment plans
3. Run in batches of 50 until all 1,800+ projects are complete

---

## Expected Results After Implementation

| Before | After |
|--------|-------|
| 1 photo per project | All gallery photos from Reelly API |
| "View Details" for bedrooms | Actual bedroom range (e.g., "Studio - 3 BR") |
| "View Details" for size | Actual size range (e.g., "500 - 2,500 sqft") |
| "On Request" for price | Actual price or "Price TBA" |
| Missing amenities section | Full amenities list with icons |
| Missing floor plans | Floor plan gallery with downloads |
| Missing payment plan | Visual payment plan timeline |
| Developer logos cropped | Full-fit logos in larger containers |
| "1 Floor" for multi-building | "1 Building" (contextual label) |
