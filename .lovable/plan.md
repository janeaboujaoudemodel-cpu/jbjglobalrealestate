
# Comprehensive Listing Fix Plan
*Full Mirroring of Provident Portal: Cards, Extraction, Layout, Forms, and UI*

---

## Executive Summary

Based on thorough code analysis and database inspection, I've identified **23 distinct issues** across the listing system that need to be fixed to achieve full Provident portal mirroring. The core problems stem from:

1. **Extraction failures** - bedrooms, sizes, floor plans, FAQs, and location distances are not being extracted or are being mixed together
2. **UI inconsistencies** - cards are rectangular not square, forms have white/black styling instead of champagne
3. **Data corruption in database** - floor_plan_types contains location data, USP images point to floor plans instead of actual USP photos

---

## Issues Categorized

### Category A: Extraction Logic Failures

| Issue | Root Cause | Impact |
|-------|------------|--------|
| Bedrooms show "Contact Us" | `bedrooms_min`/`bedrooms_max` are NULL in database | All cards show wrong data |
| Size shows "Contact Us" | `size_min`/`size_max` are NULL in database | All cards show wrong data |
| Floor plans mixed with location | Extraction regex captures location data in `floor_plan_types` | Wrong data in floor plan section |
| Location distances empty | `location_distances` array is empty despite data existing | Location section incomplete |
| FAQs not extracted | `faqs` array is empty | Useful Info section empty |
| USP image wrong | `usp_image_url` points to floor plan image, not actual USP image | Wrong hero image for USP |

### Category B: UI/Layout Issues

| Issue | Root Cause | Impact |
|-------|------------|--------|
| Cards are rectangular | `aspect-[4/3]` instead of `aspect-square` in ProjectCard | Cards don't match portal style |
| Map mixed in gallery | Gallery shows map thumbnail as last image | Confusing gallery |
| Vertical photos have gaps | No frame/background behind vertical images | Poor visual appearance |
| Fullscreen view cropped | Dialog `translate-y-[-50%]` causes top crop | Content hidden |
| Forms have white/black styling | Form inputs use white background with black borders | Not champagne style |
| CTA form has white background | CallToActionSection form uses white inputs | Inconsistent styling |

### Category C: Missing Features

| Issue | Root Cause | Impact |
|-------|------------|--------|
| Brochure not in sticky nav | `SUB_NAV_TABS` doesn't include brochure tab | Can't quick-navigate to brochure |
| No dedicated brochure section | Brochure section lacks left-side description | Doesn't match portal style |
| No calendar picker in forms | Forms lack date/time selection | Can't schedule callbacks |
| No contact method preference | Forms don't ask how user wants to be contacted | Missing preference data |
| No save/share buttons | Contact section lacks save vCard and share buttons | Missing functionality |
| Risk section flags 2028 handover | AI Analyzer marks 2028 as risk when it's only 2 years away | Misleading analysis |

---

## Implementation Plan

### Phase 1: Fix Extraction Logic

**Files to modify:**
- `supabase/functions/_shared/provident/extract.ts`
- `supabase/functions/batch-extract-pending/index.ts`

**Changes:**

1. **Fix bedroom extraction** (lines 117-127 in extract.ts)
   - Current regex: `/((?:Studio|[\d,&\s\-]+)\s*(?:BR|Bedrooms?|Bedroom))/i`
   - Problem: Not capturing bedroom ranges correctly
   - Solution: Add fallback patterns for "Studio, 1, 2, 3 BR" format

2. **Fix size extraction** (lines 129-145 in extract.ts)
   - Already has regex but may not match Provident's format
   - Add pattern for "774 sq. ft. - 847 sq. ft." format with sq. ft. (period)

3. **Fix floor plan extraction** (lines 328-356 in extract.ts)
   - Problem: Regex captures location distances as floor plan labels
   - Solution: Stop extraction when encountering "![" (image) or "Location" heading
   - Only keep items that are bedroom types: "1 Bedroom", "2 Bedroom", "3 Bedroom", "Townhouse", etc.

4. **Fix location distances extraction** (lines 380-394 in extract.ts)
   - Problem: Pattern doesn't match all formats
   - Solution: Extract from the lines that match "- N Minutes – Place" pattern
   - Parse from floor_plan_types if they were incorrectly stored there

5. **Fix USP image extraction** (lines 284-300 in extract.ts)
   - Problem: Captures wrong image (floor plan instead of actual USP image)
   - Solution: Look for image BEFORE the bullet points, not after
   - Validate URL doesn't contain "Floorplan" in the path

6. **Fix FAQ extraction** (lines 424-450 in extract.ts)
   - Problem: Pattern doesn't capture FAQs
   - Solution: Look for "## Question?" followed by answer text pattern

---

### Phase 2: Fix Database Corruption

**Action:** Create data repair function to:
1. Parse `floor_plan_types` and move location data to `location_distances`
2. Re-extract bedrooms/sizes from description text if available
3. Fix `usp_image_url` to point to actual USP images (not floor plans)

**SQL Migration:**
```sql
-- Fix corrupted floor_plan_types that contain location data
UPDATE projects SET 
  floor_plan_types = (
    SELECT jsonb_agg(item) 
    FROM jsonb_array_elements(floor_plan_types) AS item
    WHERE item->>'label' !~ '^- .*Minutes'
      AND item->>'label' !~ '^!\\['
      AND item->>'label' !~ '^Location'
      AND item->>'label' !~ '^###'
      AND item->>'label' !~ '^Get more'
  )
WHERE floor_plan_types IS NOT NULL;
```

---

### Phase 3: Fix Listing Card UI

**File:** `src/components/ProjectCard.tsx`

**Changes:**
1. **Line 139: Change aspect ratio to square**
   ```tsx
   // FROM:
   <div className="aspect-[4/3] overflow-hidden relative">
   // TO:
   <div className="aspect-square overflow-hidden relative">
   ```

2. **Filter out map images from gallery** (add URL filter)
   ```tsx
   const images = (project.images || []).filter(
     img => !img.image_url?.includes('map') && !img.image_url?.includes('location')
   );
   ```

---

### Phase 4: Fix Gallery & Fullscreen Issues

**File:** `src/components/ImageCarousel.tsx`

**Changes:**

1. **Add background frame for vertical images**
   ```tsx
   <div className="relative w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
     <img
       src={images[currentIndex].image_url}
       alt={...}
       className="max-w-full max-h-full object-contain"
     />
   </div>
   ```

2. **Fix fullscreen cropping** - adjust dialog positioning
   ```tsx
   // In Dialog content wrapper:
   className="fixed inset-0 z-50 flex items-center justify-center p-4"
   ```

3. **Filter map images from gallery**
   ```tsx
   const filteredImages = images.filter(
     img => !img.image_url?.toLowerCase().includes('map')
   );
   ```

---

### Phase 5: Add Brochure to Sticky Nav & Create Dedicated Section

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

**Changes:**

1. **Add brochure to SUB_NAV_TABS** (line 96-107)
   ```tsx
   const SUB_NAV_TABS = [
     { id: "details", label: "Details", icon: FileText },
     { id: "gallery", label: "Gallery", icon: ImageIcon },
     { id: "usp", label: "Highlights", icon: Star },
     { id: "floor-plans", label: "Floor Plans", icon: Layers },
     { id: "amenities", label: "Amenities", icon: Building2 },
     { id: "location", label: "Location", icon: MapPin },
     { id: "brochure", label: "Brochure", icon: Download }, // NEW
     { id: "payment", label: "Payment Plan", icon: CreditCard },
     // ... rest
   ];
   ```

2. **Create two-column brochure section** (around line 672)
   ```tsx
   <div ref={brochureRef} id="brochure" className="mb-12 scroll-mt-40">
     <div className="jj-card-inner">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
         {/* Left: Description */}
         <div>
           <h3 className="text-h3-sm font-medium text-foreground mb-4">
             Project Brochure
           </h3>
           <p className="text-muted-foreground mb-4">
             Download the complete brochure for {project.name} to explore 
             detailed floor plans, pricing, payment options, and lifestyle 
             amenities. Perfect for offline viewing and sharing.
           </p>
           <ul className="space-y-2 text-sm text-muted-foreground">
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4 text-gold" /> Full floor plan layouts
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4 text-gold" /> Detailed specifications
             </li>
             <li className="flex items-center gap-2">
               <Check className="w-4 h-4 text-gold" /> Payment plan breakdown
             </li>
           </ul>
         </div>
         {/* Right: Brochure card */}
         <div className="flex justify-center">
           <PremiumBrochureCard
             projectName={project.name}
             brochureUrl={brochurePrimary?.url}
             projectImageUrl={heroImageUrl}
             onDownloadClick={() => handleDocumentDownload("brochure", brochurePrimary?.url)}
             isLocked={!isLeadCaptured && !!brochurePrimary}
           />
         </div>
       </div>
     </div>
   </div>
   ```

---

### Phase 6: Fix Form Styling (Champagne Theme)

**Files to modify:**
- `src/components/project-detail/CallToActionSection.tsx`
- `src/components/ConsultationRequestForm.tsx`

**Changes for CallToActionSection.tsx (lines 150-240):**

1. **Change form background from white to champagne**
   ```tsx
   // FROM:
   className="bg-card border-gold/30"
   // TO:
   className="bg-gradient-to-br from-champagne/20 via-champagne-light/10 to-champagne/20 border-gold/30"
   ```

2. **Change input styling**
   ```tsx
   // FROM:
   <Input className="bg-card border-gold/30 focus:border-gold" />
   // TO:
   <Input className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/40 focus:border-gold text-black" />
   ```

3. **Add preferred contact time field**
   ```tsx
   <FormField
     control={form.control}
     name="preferredTime"
     render={({ field }) => (
       <FormItem>
         <FormLabel className="text-foreground">Preferred Time to Call</FormLabel>
         <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
             <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/40">
               <SelectValue placeholder="Select time slot" />
             </SelectTrigger>
           </FormControl>
           <SelectContent className="bg-white">
             <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
             <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
             <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
             <SelectItem value="anytime">Anytime</SelectItem>
           </SelectContent>
         </Select>
       </FormItem>
     )}
   />
   ```

4. **Add contact method preference field**
   ```tsx
   <FormField
     control={form.control}
     name="contactMethod"
     render={({ field }) => (
       <FormItem>
         <FormLabel className="text-foreground">Preferred Contact Method</FormLabel>
         <Select onValueChange={field.onChange} value={field.value}>
           <FormControl>
             <SelectTrigger className="...champagne styling...">
               <SelectValue placeholder="How should we contact you?" />
             </SelectTrigger>
           </FormControl>
           <SelectContent>
             <SelectItem value="phone">Phone Call</SelectItem>
             <SelectItem value="whatsapp">WhatsApp</SelectItem>
             <SelectItem value="email">Email</SelectItem>
             <SelectItem value="zoom">Video Call (Zoom)</SelectItem>
           </SelectContent>
         </Select>
       </FormItem>
     )}
   />
   ```

---

### Phase 7: Fix AI Analyzer Risk Logic

**File:** `src/components/AIMarketAnalyzer.tsx` (or related AI analysis component)

**Change:**
- Don't flag handover dates within 3 years as "risk"
- Only show handover as risk if > 4 years away

```typescript
const currentYear = new Date().getFullYear();
const handoverYear = parseInt(handoverDate?.match(/\d{4}/)?.[0] || '0');
const yearsUntilHandover = handoverYear - currentYear;

// Only flag as risk if handover is more than 4 years away
const isHandoverRisk = yearsUntilHandover > 4;
```

---

### Phase 8: Add Save/Share Buttons to Contact Section

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`

**Add after the contact cards section (around line 829):**
```tsx
<div className="flex justify-center gap-4 mt-6">
  <Button
    variant="secondary"
    size="sm"
    onClick={handleSaveContact}
    className="gap-2"
  >
    <Download className="w-4 h-4" />
    Save Contact
  </Button>
  <Button
    variant="secondary"
    size="sm"
    onClick={handleShare}
    className="gap-2"
  >
    <Share2 className="w-4 h-4" />
    Share
  </Button>
</div>
```

---

### Phase 9: Fix Dialog Cropping Globally

**File:** `src/components/ui/dialog.tsx`

**Change line 39:**
```tsx
// FROM:
className="fixed left-[50%] top-[50%] ... translate-y-[-50%] ..."
// TO:
className="fixed left-[50%] top-[50%] ... translate-y-[-50%] max-h-[calc(100vh-2rem)] ..."
```

---

## Files to Modify Summary

| File | Changes |
|------|---------|
| `supabase/functions/_shared/provident/extract.ts` | Fix all extraction regexes (bedrooms, sizes, floor plans, location, USP, FAQs) |
| `supabase/functions/batch-extract-pending/index.ts` | Map all fixed fields correctly |
| `src/components/ProjectCard.tsx` | Change to square aspect ratio, filter map images |
| `src/components/ImageCarousel.tsx` | Add frame for vertical images, filter maps, fix fullscreen |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Add brochure to nav, create dedicated brochure section, add save/share |
| `src/components/project-detail/CallToActionSection.tsx` | Champagne form styling, add preferred time & contact method fields |
| `src/components/ConsultationRequestForm.tsx` | Verify champagne styling is applied |
| `src/components/AIMarketAnalyzer.tsx` | Fix handover risk logic |
| `src/components/ui/dialog.tsx` | Fix cropping with max-height constraint |
| Database migration | Clean corrupted floor_plan_types data |

---

## Execution Order

1. Fix extraction logic in extract.ts (prevents future bad data)
2. Deploy edge functions
3. Run database cleanup migration
4. Fix frontend UI components (cards, gallery, forms)
5. Re-extract test listings to verify fixes
6. Test end-to-end on mobile/tablet/desktop
