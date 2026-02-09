
# Developer Card Logo & Data Fix Plan

## Summary of Changes

Based on your feedback, here are the fixes needed:

1. **Make logos FIT THE FRAME** - Use `object-cover` instead of `object-contain` so logos fill the entire white box with no white borders/edges visible
2. **Keep original backgrounds** - Don't remove backgrounds from logos (the AI background removal is not needed)
3. **Populate missing descriptions** - Re-sync from Reelly API to get descriptions for the 134 developers missing them

---

## Part 1: Logo Styling Fix (Fill the Frame)

### Current Problem
Logos use `object-contain` which preserves aspect ratio but leaves white space around the logo.

### Solution
Change all logo displays to use `object-cover` with proper sizing so logos fill the entire frame edge-to-edge.

### Files to Modify

**1. `src/components/DeveloperCard.tsx` (lines 92-99)**

Current:
```tsx
<img
  src={developer.logo_url_processed || developer.logo_url}
  alt={`${developer.name} logo`}
  className="max-h-10 max-w-[85%] object-contain"
  loading="lazy"
/>
```

Change to:
```tsx
<img
  src={developer.logo_url_processed || developer.logo_url}
  alt={`${developer.name} logo`}
  className="w-full h-full object-cover"
  loading="lazy"
/>
```

Also remove the white background styling and use the logo's native background:
```tsx
<div 
  className="w-20 h-12 rounded-lg flex items-center justify-center overflow-hidden"
  style={{
    border: '2px solid hsl(42 45% 59%)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  }}
>
```

**2. `src/pages/DeveloperDetail.tsx` (lines 121-127)**

Current:
```tsx
<img
  src={developer.logo_url_processed || developer.logo_url}
  alt={`${developer.name} logo`}
  className="max-h-14 max-w-[90%] object-contain"
  loading="eager"
/>
```

Change to:
```tsx
<img
  src={developer.logo_url_processed || developer.logo_url}
  alt={`${developer.name} logo`}
  className="w-full h-full object-cover"
  loading="eager"
/>
```

**3. `src/components/project-detail/DeveloperInfoCard.tsx` (lines 52-57)**

Current:
```tsx
<img 
  src={developer.logo_url_processed || developer.logo_url} 
  alt={`${developer.name} logo`}
  className="max-h-10 max-w-[90%] object-contain"
/>
```

Change to:
```tsx
<img 
  src={developer.logo_url_processed || developer.logo_url} 
  alt={`${developer.name} logo`}
  className="w-full h-full object-cover"
/>
```

**4. `src/components/DeveloperSearchModal.tsx` (around line 95)**

Update logo display to use `object-cover` and fill the frame.

**5. `src/components/developer-visits/DeveloperList.tsx` (around line 90)**

Update logo display to use `object-cover` and fill the frame.

---

## Part 2: Sync Missing Developer Descriptions from Reelly

### Current State
- 554 total developers
- 420 have descriptions
- 134 are missing descriptions

### Solution
Trigger the existing `reelly-developers-sync` edge function with `mode: "full"` to re-sync all developers from the Reelly API. This will:
1. Fetch all developers from Reelly API
2. Update existing developers with new data (descriptions, logos, etc.)
3. Only update fields that have values (won't overwrite existing data with null)

### How to Trigger
Call the edge function:
```bash
POST /functions/v1/reelly-developers-sync
Body: { "mode": "full" }
```

This will update all 134 developers missing descriptions if Reelly has the data.

---

## Part 3: Remove Unused Logo Processing

Since we're keeping original logo backgrounds, we should:

1. Update `DeveloperCard.tsx` and other components to use `logo_url` directly instead of checking for `logo_url_processed`
2. The `process-developer-logos` edge function can remain but won't be called

### Simplified Logo Source

Change from:
```tsx
src={developer.logo_url_processed || developer.logo_url}
```

To:
```tsx
src={developer.logo_url}
```

---

## Files to Modify Summary

| File | Change |
|------|--------|
| `src/components/DeveloperCard.tsx` | Logo: `object-cover`, full width/height, remove white bg |
| `src/pages/DeveloperDetail.tsx` | Logo: `object-cover`, full width/height |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Logo: `object-cover`, full width/height |
| `src/components/DeveloperSearchModal.tsx` | Logo: `object-cover`, full width/height |
| `src/components/developer-visits/DeveloperList.tsx` | Logo: `object-cover`, full width/height |

---

## Execution Steps

1. **Update all logo displays** to use `object-cover` with `w-full h-full` to fill the frame
2. **Remove white background** from logo containers (let logo's native background show)
3. **Trigger Reelly sync** to populate missing descriptions
4. **Verify** on /developers page that:
   - All logos fill their frames completely
   - No white borders/edges visible
   - Descriptions show for all developers with data

---

## Visual Before/After

**Before:**
```
┌──────────────────┐
│   ┌──────────┐   │  <- White borders around logo
│   │  LOGO    │   │
│   └──────────┘   │
└──────────────────┘
```

**After:**
```
┌──────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  <- Logo fills entire frame
│▓▓▓▓▓▓LOGO▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────┘
```

---

## Testing Checklist

1. Navigate to `/developers` - verify logos fill their frames with no white borders
2. Click any developer card - verify DeveloperDetail page logo fills frame
3. View any project detail - verify developer logo in DeveloperInfoCard fills frame
4. Check that descriptions display for developers that have them
5. Confirm no visual regressions on mobile layout
