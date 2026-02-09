

# Developer Section Overhaul - Implementation Plan

## Summary of Changes

This plan addresses the following issues based on your feedback:

1. **Logo fit in project developer section** - Logo not filling the white card properly
2. **Black layer rounded corners** - Developer info card border not matching rounded style
3. **Stats showing "N/A"** - Extract from Reelly + compute from local projects
4. **"Back to Developers" button using old yellow/gold** - Replace with premium button
5. **Description section** - Add visuals, more spacing, premium styling
6. **Developers directory ordering** - Show elite developers first in exact order
7. **Logo cropping in DeveloperCard** - Fix object-fit or increase box size

---

## Part 1: Fix Logo Fit in Project Developer Section

### Problem
The logo box in `DeveloperInfoCard.tsx` uses `object-contain` which doesn't fill the white card. Some logos have excessive white space or don't scale properly.

### Solution
Update the logo container to:
1. Remove internal padding so the logo can use the full space
2. Use `object-contain` but with larger dimensions
3. Add a fallback to detect logo aspect ratio and apply appropriate sizing

### File: `src/components/project-detail/DeveloperInfoCard.tsx`

Changes at lines 43-61:
- Increase logo box size from `w-32 h-20` to `w-40 h-24` for more space
- Add `p-3` for comfortable internal padding
- Keep `object-contain` to prevent cropping
- Add background color detection fallback

---

## Part 2: Round the Black Layer Border

### Problem
The developer info card's outer container uses `jj-section-champagne` class but the inner container doesn't have rounded corners on the black background.

### Solution
The `jj-section-champagne` class applies champagne styling to child containers. The issue is that the container structure doesn't match expected patterns.

### File: `src/components/project-detail/DeveloperInfoCard.tsx`

Changes at lines 39-41:
- Replace the section wrapper with proper `jj-layer-2` for the inner champagne card
- Ensure the outer section has `bg-black` and the inner card has `rounded-2xl`
- Apply `border-2 border-gold/40` for consistency

---

## Part 3: Fix Developer Stats (Founded, Units Delivered, etc.)

### Problem
Stats show "N/A" because:
1. Reelly API provides `founded_year`, `projects_count`, `total_units` but these may be null for many developers
2. The sync function maps them but many developers don't have the data

### Solution: Dual Approach
1. **Immediate (compute)**: Calculate `offplan_projects` from our projects table count
2. **Long-term (sync)**: Expand the Reelly developer detail fetch to get more stats

### File: `src/hooks/useProjects.ts`

Changes at lines 296-310:
- Update `useDeveloper` to also fetch project count from projects table
- Or create a new hook that enriches developer data with computed stats

### File: `src/components/project-detail/DeveloperInfoCard.tsx`

Changes at lines 28-32:
- Show computed project count if API stats are null
- Display "View Portfolio" instead of "N/A" for unknown values

### File: `supabase/functions/reelly-developers-sync/index.ts`

Changes at lines 117-153:
- Fetch additional fields from Reelly API `/developers/{id}` endpoint if available
- Map more fields like `founded_year` properly

---

## Part 4: Replace "Back to Developers" Button with Premium Style

### Problem
The button uses hardcoded `bg-gold border-gold` which is the old yellow style.

### Solution
Use the locked `Button` component with `variant="primary"` which applies the champagne gradient system.

### File: `src/pages/DeveloperDetail.tsx`

Changes at lines 112-118:
```tsx
// Before
<Link 
  to="/developers" 
  className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-gold bg-gold text-black font-medium text-sm transition-all duration-200 hover:bg-transparent hover:text-gold"
>

// After
<Link to="/developers">
  <Button variant="primary" size="sm" className="group">
    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
    <span>Back to Developers</span>
  </Button>
</Link>
```

---

## Part 5: Premium Description Section with Visuals

### Problem
Developer description is plain text with minimal styling.

### Solution
1. Add more spacing between title and description (increase `mb-3` to `mb-5`)
2. Add visual elements like icon accents
3. Create a card-like container for the description
4. Add subtle background gradient

### File: `src/components/project-detail/DeveloperInfoCard.tsx`

Changes at lines 63-77 and 94-127:
- Wrap description in a styled container
- Add icon decorations
- Increase spacing between elements
- Add a subtle divider line

---

## Part 6: Developers Directory - Elite First (Exact Order)

### Problem
Developers are sorted by `rank` column but many elites have `rank=0` which doesn't differentiate them.

### Solution
Create a hardcoded priority order for elite developers and sort by:
1. First by priority order (if in the list)
2. Then by rank (for others)
3. Finally alphabetically

### File: `src/pages/Developers.tsx`

Changes at lines 68-93:
```typescript
// Define exact elite order
const ELITE_PRIORITY_ORDER = [
  'emaar', 'omniyat', 'nakheel', 'sobha', 'aldar', 
  'ellington', 'damac', 'meraas', 'dubai-properties'
];

// In filteredDevelopers useMemo:
filtered.sort((a, b) => {
  const aIdx = ELITE_PRIORITY_ORDER.indexOf(a.slug?.toLowerCase() || '');
  const bIdx = ELITE_PRIORITY_ORDER.indexOf(b.slug?.toLowerCase() || '');
  
  // Both are in priority list
  if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
  // Only a is in priority list
  if (aIdx >= 0) return -1;
  // Only b is in priority list
  if (bIdx >= 0) return 1;
  // Neither in priority list - sort by rank then name
  const rankDiff = (a.rank ?? 999) - (b.rank ?? 999);
  if (rankDiff !== 0) return rankDiff;
  return a.name.localeCompare(b.name);
});
```

---

## Part 7: Fix Logo Cropping in Developer Cards

### Problem
Logo uses `object-cover` which crops logos, but `object-contain` may leave too much empty space.

### Solution
1. Change to `object-contain` 
2. Increase box size slightly
3. Add padding so logos don't touch edges

### File: `src/components/DeveloperCard.tsx`

Changes at lines 83-103:
```tsx
// Before
<div 
  className="w-20 h-12 rounded-lg flex items-center justify-center overflow-hidden"
  ...
>
  <img
    src={developer.logo_url}
    className="w-full h-full object-cover"  // Causes cropping
  />

// After
<div 
  className="w-24 h-14 rounded-lg flex items-center justify-center overflow-hidden p-2"
  ...
>
  <img
    src={developer.logo_url}
    className="max-w-full max-h-full object-contain"  // No cropping
  />
```

Also update `DeveloperDetail.tsx` logo box at lines 126-144 with same pattern.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/project-detail/DeveloperInfoCard.tsx` | Logo sizing, rounded border, description styling, spacing |
| `src/pages/DeveloperDetail.tsx` | Premium back button, logo box sizing |
| `src/pages/Developers.tsx` | Elite-first sorting logic |
| `src/components/DeveloperCard.tsx` | Logo `object-contain` instead of `object-cover`, larger box |
| `src/hooks/useProjects.ts` | Optionally add computed stats to developer data |
| `supabase/functions/reelly-developers-sync/index.ts` | Fetch more developer detail fields (long-term) |

---

## Technical Details

### Logo Container Sizing
- **Project developer section**: `w-40 h-24` with `p-3` internal padding
- **Developer card overlay**: `w-24 h-14` with `p-2` internal padding
- **Developer detail header**: `w-36 h-24` with `p-3` internal padding

### Color System Compliance
- All buttons use `Button` component with proper variants
- No hardcoded `bg-gold` - use `variant="primary"` which uses champagne gradient
- Border colors use `border-gold/40` for consistency

### Elite Developer Order
1. Emaar
2. Omniyat
3. Nakheel
4. Sobha
5. Aldar
6. Ellington
7. DAMAC
8. Meraas
9. Dubai Properties
10. (rest by rank, then alphabetical)

---

## Test Checklist

After implementation:
1. Navigate to any project detail page with a developer section
2. Verify logo fills the white box without being cropped
3. Verify the champagne card has rounded corners on all sides
4. Verify stats show values (or graceful fallbacks, not "N/A")
5. Navigate to /developers directory
6. Verify elite developers appear at the top in the exact order
7. Verify logo overlays on cards are not cropped
8. Click "Back to Developers" button - verify it uses premium styling

