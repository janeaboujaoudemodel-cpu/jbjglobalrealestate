
# Project Detail Page Multi-Issue Fix Plan

## Overview
This plan addresses 11 distinct issues on the Project Detail page (specifically the listing admin preview) affecting forms, brochure downloads, gallery display, USP section, floor plans, payment plan display, footer newsletter, and form styling.

---

## Issues Identified

### 1. Brochure Download Blocked (`ERR_BLOCKED_BY_CLIENT`)
**Root Cause**: The brochure URL pointing to Supabase storage (`mdafrewypkkrildjgtey.supabase.co/storage/...`) is being blocked by ad-blockers/browser security as it looks like a tracking URL.

**Solution**: Implement a download proxy that fetches the file server-side and streams it to the client with proper headers, or use a direct download approach with proper CORS headers.

### 2. Register Interest Form - Missing Project Name Tracking
**Current**: `ConsultationRequestForm` is used but doesn't track which specific project the user registered interest from.

**Solution**: Update `ConsultationRequestForm` to accept and include `projectId` and `projectName` in the CRM lead data.

### 3. Register Interest Form - Black Borders Instead of Gold
**Current**: Form elements use black/zinc borders from `SearchableSelect` component.

**Solution**: Update form styling to use gold borders (`border-gold/30` to `border-gold`) matching the champagne gradient theme.

### 4. Contact Us Section - Needs Work
**Current**: The Contact Us Directly section exists but may need styling polish.

**Solution**: Verify and enhance the Contact Us section styling with consistent gold borders and champagne gradient backgrounds.

### 5. Request a Callback Now Section - Inconsistent Form Styling
**Current**: `CallToActionSection.tsx` has mixed border styling - some inputs gold, some black. Phone input shows square corners.

**Solution**: Standardize all form inputs in `CallToActionSection.tsx` to use gold borders (`border-gold/30`) and consistent rounded corners.

### 6. Footer Newsletter - "Stay in the Loop" Issue
**Current**: Footer has the "Stay in the Loop" section but may need styling alignment.

**Solution**: Verify footer newsletter section matches the specified design.

### 7. Floor Plans Not Correct - Photos Not Showing
**Root Cause**: `floor_plan_types` only has labels like "4 Bedroom Villas" but no `pdfUrl` or `imageUrl` attached. The FloorPlanGallery component shows "Floor plan preview not available" when no image exists.

**Solution**: The extraction needs to be improved to capture floor plan PDFs. For UI, show a better placeholder and link to brochure download when floor plan PDFs are missing.

### 8. Gallery Photos - Wide Gaps on Sides
**Current**: `ImageCarousel` uses `object-contain` which shows gaps for vertical/non-16:9 images.

**Solution**: Change to `object-cover` to fill the frame, potentially with zoom controls or different cropping strategies.

### 9. USP Section - Not Matching Provident Style
**Current**: USP section shows bullet points but the `usp_image_url` is null so no image is shown next to the USPs.

**Solution**: 
- When no USP image exists, use the first gallery image as fallback
- Improve the USP section layout to better match Provident's style with image prominently displayed

### 10. Payment Plan Display - Bad Messaging
**Current**: Shows "Long headline until 2029 handover" which sounds negative.

**Solution**: Reframe as positive messaging like "Benefit from extended payment terms" or "Attractive long-term payment plan".

### 11. Payment Breakdown - Missing 20% On Completion
**Current**: Shows 80/20 plan but breakdown only has `down_payment: 10%` and `during_construction: 70%` - missing the 20% on completion.

**Solution**: The extraction regex needs to capture all three payment milestones. For display, if only two are captured, calculate the third from the payment plan ratio.

---

## Technical Implementation

### Phase 1: Form Styling Fixes (Priority: High)

#### File: `src/components/ConsultationRequestForm.tsx`
**Changes**:
1. Add `projectId` and `projectName` props
2. Include project context in CRM lead submission
3. Ensure all form inputs use gold border styling

```typescript
interface ConsultationRequestFormProps {
  className?: string;
  title?: string;
  subtitle?: string;
  projectId?: string;      // NEW
  projectName?: string;    // NEW
}
```

Update the `captureLead` call to include project context.

#### File: `src/components/project-detail/CallToActionSection.tsx`
**Changes**:
1. Standardize all Input/Select borders to gold
2. Fix PhoneInput border radius consistency
3. Add gold hover states

Replace inconsistent styling:
```tsx
// Before
<Input placeholder="..." {...field} />

// After  
<Input 
  placeholder="..." 
  {...field} 
  className="border-gold/30 focus:border-gold"
/>
```

#### File: `src/components/ui/searchable-select.tsx`
**Changes**:
1. Change dark zinc styling to gold/champagne theme
2. Update trigger button to use gold border instead of zinc

```tsx
// Before
className="bg-zinc-900/80 border-zinc-700/50 text-white hover:bg-zinc-800"

// After
className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black hover:border-gold/60"
```

---

### Phase 2: Gallery Image Display (Priority: High)

#### File: `src/components/ImageCarousel.tsx`
**Changes**:
1. Change `object-contain` to `object-cover` for main image display
2. Add proper aspect ratio handling to eliminate side gaps

```tsx
// Before (line ~87-91)
<img
  src={images[currentIndex].image_url}
  className="max-w-full max-h-full w-full h-full object-contain"
/>

// After
<img
  src={images[currentIndex].image_url}
  className="w-full h-full object-cover"
/>
```

---

### Phase 3: USP Section Enhancement (Priority: Medium)

#### File: `src/components/project-detail/ProjectDetailLayout.tsx`
**Changes** (lines ~472-520):
1. Use first gallery image as fallback when `usp_image_url` is null
2. Improve layout to match Provident's style with image on left, bullets on right
3. Add premium styling with gold accents

```tsx
// Fallback image for USP section
const uspImageUrl = project.usp_image_url || images[0]?.url;
```

---

### Phase 4: Payment Plan Display Fix (Priority: Medium)

#### File: `src/components/project-detail/ProjectDetailLayout.tsx`
**Changes** (lines ~720-780):
1. Improve payment plan headline messaging
2. Auto-calculate missing payment milestone when only two are provided
3. Reframe negative "long timeline" as positive "extended payment benefit"

```tsx
// Calculate missing on_completion if not present
const paymentBreakdown = useMemo(() => {
  const breakdown = project.payment_breakdown || {};
  if (breakdown.down_payment && breakdown.during_construction && !breakdown.on_completion) {
    // Extract percentages and calculate remainder
    const dpPercent = parseInt(breakdown.down_payment) || 0;
    const dcPercent = parseInt(breakdown.during_construction) || 0;
    const remaining = 100 - dpPercent - dcPercent;
    if (remaining > 0) {
      return { ...breakdown, on_completion: `${remaining}%` };
    }
  }
  return breakdown;
}, [project.payment_breakdown]);
```

---

### Phase 5: Brochure Download Fix (Priority: High)

#### File: `src/components/project-detail/PremiumBrochureCard.tsx`
**Changes**:
1. Implement a download handler that uses fetch + blob approach
2. Add proper error handling for blocked URLs

```tsx
const handleDownload = async () => {
  if (!brochureUrl) return;
  
  try {
    // Fetch the PDF and create blob URL
    const response = await fetch(brochureUrl);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '-')}-Brochure.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    // Fallback to window.open
    window.open(brochureUrl, '_blank');
  }
};
```

---

### Phase 6: Floor Plan Section Enhancement (Priority: Medium)

#### File: `src/components/project-detail/ProjectDetailLayout.tsx`
**Changes** (lines ~522-563):
1. When floor plan PDF is missing, show helpful message with brochure download option
2. Improve floor plan card styling

---

### Phase 7: Register Interest Form - Project Context (Priority: High)

#### File: `src/components/project-detail/ProjectDetailLayout.tsx`
**Changes** (lines ~819-827):
1. Pass `projectId` and `projectName` to `ConsultationRequestForm`

```tsx
<ConsultationRequestForm
  title={`Register Interest in ${project.name}`}
  subtitle={...}
  projectId={project.id}        // NEW
  projectName={project.name}    // NEW
/>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ConsultationRequestForm.tsx` | Add project context props, update CRM submission |
| `src/components/project-detail/CallToActionSection.tsx` | Standardize gold form styling |
| `src/components/ui/searchable-select.tsx` | Change to gold/champagne theme |
| `src/components/ImageCarousel.tsx` | Change to `object-cover` for images |
| `src/components/project-detail/ProjectDetailLayout.tsx` | USP fallback image, payment calculation, project context |
| `src/components/project-detail/PremiumBrochureCard.tsx` | Blob download approach for brochure |

---

## Summary of Fixes

1. **Brochure Download** → Use fetch+blob download to bypass ad-blocker
2. **Register Interest Project Tracking** → Add projectId/projectName to CRM data
3. **Form Gold Borders** → Update all form inputs to gold borders
4. **Gallery Gaps** → Change object-contain to object-cover
5. **USP Image Missing** → Use first gallery image as fallback
6. **Payment Plan Messaging** → Reframe as positive benefits
7. **Payment Breakdown Missing 20%** → Auto-calculate from 80/20 ratio
8. **Floor Plans** → Better fallback when PDFs missing
9. **SearchableSelect Styling** → Gold/champagne theme instead of zinc

---

## Acceptance Criteria

- Brochure downloads work without "ERR_BLOCKED_BY_CLIENT"
- Register Interest form submissions include project name in CRM
- All form inputs have consistent gold borders
- Gallery images fill the frame without side gaps
- USP section shows an image (fallback to gallery if needed)
- Payment breakdown shows all three milestones (10% + 70% + 20%)
- Floor plan section provides helpful guidance when PDFs are missing
