
# Comprehensive Project Detail & Listing Admin Fixes

## Overview
This plan addresses all remaining issues with the Project Detail page for Palmiera Collective and the Listing Admin interface, including brochure branding visibility, form styling, contact actions, floor plans checklist, card aspect ratio, and performance improvements.

---

## Issues to Fix

### 1. Brochure Monogram Not Visible
**Problem**: The current monogram (`jbj-monogram-transparent.png`) is black text on dark background, making it invisible.

**Solution**: Use `jbj-monogram-nobuffer.png` (the light/white version for dark backgrounds) instead.

**File**: `src/components/project-detail/PremiumBrochureCard.tsx`
- Change import from `jbj-monogram-transparent.png` to `jbj-monogram-nobuffer.png`
- This version has white/light colored letters visible on dark backgrounds

---

### 2. Brochure Background Image
**Problem**: Each brochure uses the project's image, but user wants a consistent Dubai downtown Burj Khalifa view.

**Solution**: Replace `projectImageUrl` usage with a hardcoded premium Dubai skyline image from assets.

**File**: `src/components/project-detail/PremiumBrochureCard.tsx`
- Import a standard Burj Khalifa downtown image (use `menu-downtown-dubai-skyline.jpg` from assets)
- Use this as the default background for all brochures
- Keep project name/title for identification

---

### 3. Test Extraction - Remove "View Full Page" Button
**Problem**: "View Full Page" button is confusing; user should click on card or "more" link instead.

**Solution**: Remove the "View Full Page" button from the TestOneListingPanel.

**File**: `src/components/listing-admin/TestOneListingPanel.tsx`
- Remove lines 666-675 (the "View Full Page" button)

---

### 4. Add Floor Plans to Extraction Checklist
**Problem**: Floor Plans extraction status is missing from the checklist.

**Solution**: Add floor plan check to both the checklist interface and display.

**File**: `src/components/listing-admin/TestOneListingPanel.tsx`
- Add `hasFloorPlans` and `floorPlanCount` to the checklist interface
- Parse `floor_plan_types` from the extracted data
- Add ChecklistItem for "Floor Plans" in the checklist display

---

### 5. Listing Card Aspect Ratio - Vertical/Square
**Problem**: Cards are rectangular, should match source portal's vertical/square layout.

**Solution**: Change card image aspect ratio from `h-56` (rectangular) to `aspect-square` (1:1).

**File**: `src/components/listing-admin/PendingImportCard.tsx`
- Change `h-56` to `aspect-square` on the image container

---

### 6. Developer Name - Gold and Clickable
**Problem**: Developer name should be gold colored and link to developer page.

**Solution**: Make developer name a gold Link to `/developer/{slug}` page.

**File**: `src/components/listing-admin/PendingImportCard.tsx`
- Wrap developer name in Link component
- Add gold styling and hover effect

---

### 7. Contact Section - Add Save Contact & Share Buttons
**Problem**: Missing "Save Contact" and "Share" actions under the contact cards.

**Solution**: Add two new action buttons below the existing contact cards.

**File**: `src/components/project-detail/ProjectDetailLayout.tsx`
- Add "Save Contact" button (generates vCard download)
- Add "Share" button (uses Web Share API with fallback)

---

### 8. USP Section Image
**Problem**: USP section uses first gallery image instead of the source portal's USP image.

**Note**: This is already implemented correctly - fallback to first gallery image when `usp_image_url` is null. The extraction itself needs to capture the correct USP image from the source. This is an extraction issue, not a UI issue.

---

### 9. Performance - Listing Page Scrolling/Crashing
**Problem**: Page reloads/crashes, slow scrolling due to real-time subscription overhead.

**Solution**: Debounce the realtime subscription handler properly.

**File**: `src/components/listing-admin/ProjectApprovalQueue.tsx`
- Fix the debounce logic in the realtime subscription (current implementation doesn't properly clear timeout)

---

## Technical Implementation Details

### File 1: `src/components/project-detail/PremiumBrochureCard.tsx`

```tsx
// Change import
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";
import downtownDubai from "@/assets/menu-downtown-dubai-skyline.jpg";

// Use nobuffer monogram (visible on dark backgrounds)
<img 
  src={jbjMonogramNobuffer}  // Changed from jbjMonogramTransparent
  alt="JBJ" 
  className="w-full h-full object-contain"
/>

// Use consistent downtown Dubai background
<div 
  className="absolute inset-0 bg-cover bg-center"
  style={{ backgroundImage: `url(${downtownDubai})` }}  // Changed from projectImageUrl
/>
```

### File 2: `src/components/listing-admin/TestOneListingPanel.tsx`

**Remove View Full Page button** (lines 666-675):
```tsx
// DELETE this block:
<Link to={`/listing-admin/preview/${testResult.project.id}`}>
  <Button
    variant="outline"
    size="sm"
    className="gap-1"
  >
    <Eye className="w-4 h-4" />
    View Full Page
  </Button>
</Link>
```

**Add Floor Plans to checklist interface**:
```tsx
interface TestResult {
  // ... existing fields
  checklist?: {
    // ... existing fields
    hasFloorPlans: boolean;
    floorPlanCount: number;
  };
}
```

**Add floor plan parsing and checklist item**:
```tsx
// After parsing other fields
const floorPlanTypes: Array<{ label: string }> = parseJsonField(updatedProject.floor_plan_types, []);
const hasFloorPlans = floorPlanTypes.length >= 1;

// In checklist object
const checklist = {
  // ... existing fields
  hasFloorPlans,
  floorPlanCount: floorPlanTypes.length,
};

// In ChecklistItem display (after hasPaymentBreakdown)
<ChecklistItem 
  label="Floor Plans" 
  passed={testResult.checklist.hasFloorPlans} 
  detail={`${testResult.checklist.floorPlanCount} found`}
/>
```

### File 3: `src/components/listing-admin/PendingImportCard.tsx`

**Square aspect ratio**:
```tsx
// Change from:
<div className="relative h-56 bg-muted">

// To:
<div className="relative aspect-square bg-muted">
```

**Developer name as gold link**:
```tsx
// Change from:
{item.developer_name && <p className="text-sm text-gold truncate">by {item.developer_name}</p>}

// To:
{item.developer_name && (
  <Link 
    to={`/developers`}  // Link to developers page (no slug available in pending imports)
    onClick={(e) => e.stopPropagation()}
    className="text-sm text-gold truncate hover:underline"
  >
    by {item.developer_name}
  </Link>
)}
```

### File 4: `src/components/project-detail/ProjectDetailLayout.tsx`

**Add Save Contact & Share buttons** (after the 3 contact cards):
```tsx
import { Download, Share2, UserPlus } from "lucide-react";

// Add utility functions
const handleSaveContact = () => {
  const vcard = `BEGIN:VCARD
VERSION:3.0
N:JBJ Global Real Estate
FN:JBJ Global Real Estate
ORG:JBJ Global Real Estate
TEL;TYPE=WORK,VOICE:${CONTACT_INFO.phone}
EMAIL:${CONTACT_INFO.email}
URL:https://jbjglobalrealestate.lovable.app
END:VCARD`;
  
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'JBJ-Global-Real-Estate.vcf';
  link.click();
  URL.revokeObjectURL(url);
};

const handleShare = async () => {
  const shareData = {
    title: project.name,
    text: `Check out ${project.name} - ${project.location || 'Dubai, UAE'}`,
    url: window.location.href,
  };
  
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled or error
    }
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  }
};

// Add buttons row after contact cards grid
<div className="flex justify-center gap-4 mt-6">
  <Button
    variant="secondary"
    onClick={handleSaveContact}
    className="gap-2"
  >
    <UserPlus className="w-4 h-4" />
    Save Contact
  </Button>
  <Button
    variant="secondary"
    onClick={handleShare}
    className="gap-2"
  >
    <Share2 className="w-4 h-4" />
    Share
  </Button>
</div>
```

### File 5: `src/components/listing-admin/ProjectApprovalQueue.tsx`

**Fix debounce in realtime subscription** (lines 277-303):
```tsx
// Fix the debounce - use useRef for timer
const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
  const channel = supabase
    .channel('pending_imports_realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pending_project_imports',
        filter: 'status=eq.pending'
      },
      () => {
        // Clear previous timer
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
        }
        // Debounce rapid updates
        refreshTimerRef.current = setTimeout(() => {
          fetchPendingImports();
          fetchInventoryStats();
        }, 1500);
      }
    )
    .subscribe();

  return () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    supabase.removeChannel(channel);
  };
}, [jobId, showAll]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/project-detail/PremiumBrochureCard.tsx` | Use visible monogram + consistent Dubai background |
| `src/components/listing-admin/TestOneListingPanel.tsx` | Remove "View Full Page", add Floor Plans checklist |
| `src/components/listing-admin/PendingImportCard.tsx` | Square aspect ratio, gold developer link |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add Save Contact + Share buttons |
| `src/components/listing-admin/ProjectApprovalQueue.tsx` | Fix debounce for performance |

---

## Summary

1. **Brochure Monogram** - Switch to `jbj-monogram-nobuffer.png` for visibility on dark backgrounds
2. **Brochure Background** - Use consistent Dubai downtown skyline image
3. **Remove View Full Page** - Clean up TestOneListingPanel UI
4. **Floor Plans Checklist** - Add to extraction checklist
5. **Card Aspect Ratio** - Change to square (1:1) like source portal
6. **Developer Link** - Gold colored, clickable
7. **Contact Actions** - Add Save Contact (vCard) + Share buttons
8. **Performance** - Fix realtime subscription debounce
