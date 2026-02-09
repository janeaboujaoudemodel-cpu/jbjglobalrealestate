

# Developer Listing & Page Master Fix Plan

## Summary of Issues to Fix

Based on my investigation, here are the three critical problems:

1. **Logo Rendering**: Logos are too small and not filling the frame. The current code uses `max-h-9 max-w-[85%] object-contain` which constrains logos to a tiny size instead of filling the white box.

2. **Developer Photos**: 30 developers still have stock Unsplash images. Many developers without Dubai projects need photos sourced from Provident.

3. **Non-Dubai Projects**: 9 projects exist from locations like Oman (Muscat, Dhofar) that should be removed per your requirement to keep only Dubai.

---

## Part 1: Logo Rendering Fix (STRETCH TO FILL THE FRAME)

### Current Problem
The logo image uses:
```tsx
className="max-h-9 max-w-[85%] object-contain"
```

This constrains the logo to be tiny within the 80x48px container, leaving lots of white space.

### Solution
Change to `w-full h-full object-cover` so the logo FILLS the entire frame edge-to-edge with no white borders.

### Files to Update

**1. DeveloperCard.tsx (lines 94-99)**
Change from:
```tsx
<img
  src={developer.logo_url}
  alt={`${developer.name} logo`}
  className="max-h-9 max-w-[85%] object-contain"
  loading="lazy"
/>
```

To:
```tsx
<img
  src={developer.logo_url}
  alt={`${developer.name} logo`}
  className="w-full h-full object-cover"
  loading="lazy"
/>
```

**2. DeveloperDetail.tsx (lines 134-139)**
Change from:
```tsx
<img
  src={developer.logo_url}
  alt={`${developer.name} logo`}
  className="max-h-12 max-w-[90%] object-contain"
  loading="eager"
/>
```

To:
```tsx
<img
  src={developer.logo_url}
  alt={`${developer.name} logo`}
  className="w-full h-full object-cover"
  loading="eager"
/>
```

**3. DeveloperInfoCard.tsx (line 52-57)**
Apply same `w-full h-full object-cover` pattern.

**4. DeveloperSearchModal.tsx**
Apply same pattern.

**5. DeveloperList.tsx**
Apply same pattern.

### Logo Container Styling
Keep the container with:
- Fixed dimensions (w-20 h-12 for cards, w-24 h-16 for detail page)
- White background
- Gold border
- `overflow-hidden` to clip the logo cleanly

---

## Part 2: Remove Non-Dubai Projects

### Current State
9 projects exist outside UAE (Oman - Muscat Governorate, Dhofar Governorate).

### Solution
Run a database cleanup to delete or archive projects not in Dubai or other UAE emirates.

### SQL Migration
```sql
-- Delete projects outside UAE (Oman, Bali, Thailand, Cyprus, etc.)
DELETE FROM projects
WHERE emirate IN ('Muscat Governorate', 'Dhofar Governorate')
   OR emirate NOT IN (
     'Dubai',
     'Abu Dhabi', 'Abu Dhabi Emirate',
     'Sharjah', 'Sharjah Emirate',
     'Ajman', 'Ajman Emirate',
     'Ras Al Khaimah', 'Ras al-Khaimah', 'Ras al-Khaimah Emirate',
     'Fujairah', 'Fujairah Emirate',
     'Umm Al Quwain', 'Umm al-Quwain', 'Umm al-Quwain Emirate'
   );
```

This will remove the 9 non-UAE projects.

---

## Part 3: Developer Photo Fix (Source from Reelly + Provident)

### Current State
- 30 developers still have stock Unsplash images
- These developers have 0 projects in our database
- Need to search Provident for their data

### Solution: Two-Step Process

**Step A: Update fix-developer-photos function**
Modify the edge function to:
1. First try to find images from Reelly API (current behavior)
2. If no image found, fall back to Provident Estate scraping
3. Use the `extract-developers-provident` function data

**Step B: Run combined sync**
1. First run `extract-developers-provident` to get Provident developer data
2. Then run `fix-developer-photos` with new fallback logic

### Enhanced fix-developer-photos/index.ts
Add Provident fallback:
```typescript
// After Reelly lookup fails, try Provident
if (mode === "fix-all" && !selectedImage) {
  // Query pending_developer_imports for Provident data
  const { data: providentData } = await supabase
    .from("pending_developer_imports")
    .select("feature_image_url, logo_url")
    .eq("slug", developer.slug)
    .eq("source", "provident_estate")
    .single();
  
  if (providentData?.feature_image_url && !usedImages.has(providentData.feature_image_url)) {
    selectedImage = providentData.feature_image_url;
    usedImages.add(selectedImage);
  }
}
```

---

## Part 4: Developer Data Integrity (Match Reelly Exactly)

### Issue
Some developers exist in our database but have no projects (came from Reelly but may be duplicates or international developers).

### Solution
1. Keep developers that have at least 1 project in Dubai
2. For developers with 0 Dubai projects, check if they exist in Provident
3. If not found in either source with UAE projects, mark as "international" or hide from listing

### SQL Query to Identify
```sql
SELECT d.id, d.name, d.slug, 
       COUNT(p.id) as dubai_project_count
FROM developers d
LEFT JOIN projects p ON p.developer_id = d.id AND p.emirate = 'Dubai'
GROUP BY d.id, d.name, d.slug
HAVING COUNT(p.id) = 0
ORDER BY d.name;
```

This identifies developers with no Dubai projects who may need hiding or Provident data.

---

## Implementation Sequence

1. **Logo Fix** - Update all 5 component files to use `w-full h-full object-cover`

2. **Remove Non-UAE Projects** - Run database migration to delete Oman and other non-UAE projects

3. **Extract Provident Developers** - Call `extract-developers-provident` to populate pending_developer_imports with Provident data

4. **Fix Developer Photos** - Update and run `fix-developer-photos` with Provident fallback to fill missing photos

5. **Verify** - Confirm:
   - All logos fill their frames
   - No stock photos remain
   - Only UAE projects shown
   - Developer pages load without crashes

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/DeveloperCard.tsx` | Logo: `w-full h-full object-cover` |
| `src/pages/DeveloperDetail.tsx` | Logo: `w-full h-full object-cover` |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Logo: `w-full h-full object-cover` |
| `src/components/DeveloperSearchModal.tsx` | Logo: `w-full h-full object-cover` |
| `src/components/developer-visits/DeveloperList.tsx` | Logo: `w-full h-full object-cover` |
| `supabase/functions/fix-developer-photos/index.ts` | Add Provident fallback for photos |
| Database | Delete 9 non-UAE projects |

---

## Verification Checklist

After implementation:
- [ ] Logos fill their frames completely (no white borders)
- [ ] Sobha, Beyond, H&H, MAG, Farad, Nshama logos all visible and readable
- [ ] No stock Unsplash photos on any developer card
- [ ] No projects from Oman, Bali, Thailand, Cyprus visible
- [ ] All developer detail pages load without boot errors
- [ ] Each developer has unique photo (no duplicates)

