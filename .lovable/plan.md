
# Comprehensive Fix: Currency/Unit Wiring, Hero Layout, Payment Plans, Amenities, and UI Polish

This plan addresses all uncompleted tasks identified across the project detail pages, homepage hero, and global settings.

---

## 1. Currency Toast -- Add Developer, Area, and Project Pages to Message

**Problem:** The first-time currency change toast only mentions "homepage search bar, My Account, or the footer" but not developer, area, or project pages.

**Fix in `src/components/home/HeroSearchBar.tsx` (line 412):**
- Change the toast description to: `'You can change this anytime from any Search, Developer, Area, or Project page, My Account dropdown, or the Footer.'`

---

## 2. Homepage Hero -- Push Content Down and Hide Chat/Arrows on First Load

**Problem:** The Buy/Sell/Rent content and search bar hide the metro video. Chat support widget and navigation arrows should be hidden on initial fold.

### 2a. Push content down

**Fix in `src/pages/Index.tsx` (line 147):**
- Change `pt-56 sm:pt-40 md:pt-48 lg:pt-56` to `pt-72 sm:pt-60 md:pt-64 lg:pt-72` to push content significantly lower, revealing more of the video scene

### 2b. Hide chat widget and arrows on first load

**Fix in `src/components/MainLayout.tsx`:**
- Add a scroll-based state that hides the `AIChatWidget` on the homepage until the user scrolls past the hero section (past ~90vh)
- Pass a `hidden` prop or conditionally render the chat widget based on scroll position
- For navigation arrows in the hero: check if any carousel arrows exist in the hero area and conditionally hide them until scroll

---

## 3. Wire Area Unit (sqft/sqm) Globally Across All Pages

**Problem:** When user selects "Square Meter" from the hero search bar, the project detail page still shows "sqft" everywhere. The `jj_area_unit` localStorage value is set but not consumed by project pages.

### 3a. Create a `useAreaUnit` hook

**New file: `src/hooks/useAreaUnit.ts`**
- Similar to `useCurrency`, reads `jj_area_unit` from localStorage and listens for `areaUnitChange` events
- Provides `areaUnit` (sqft/sqm), `formatSize(sqftValue)` helper that converts and labels correctly
- Conversion: 1 sqft = 0.0929 sqm

### 3b. Wire into ProjectDetailLayout.tsx

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx`:**
- Import and use `useAreaUnit` hook
- In `deriveSizeFromUnitTypes` (lines 467-478): replace hardcoded `sqft` with dynamic unit from hook
- In `sizeText` memo (lines 494-498): replace hardcoded `sqft` with dynamic unit
- In hero USP row (line 580): use formatted size from hook

### 3c. Wire into UnitInventorySection.tsx

**Fix in `src/components/project-detail/UnitInventorySection.tsx` (lines 130-133):**
- Import `useAreaUnit` hook
- Replace hardcoded `sqft` labels with dynamic unit and converted values

### 3d. Wire into ProjectCard.tsx and other listing components

- All components displaying size must use the `useAreaUnit` hook instead of hardcoded "sqft"

---

## 4. Monogram -- Remove Background Everywhere

**Problem:** Some components still use `jbj-monogram-transparent.png` (which has a background behind B) instead of `jbj-monogram-nobuffer.png`.

**Audit and fix:**
- Search all files importing `jbj-monogram-transparent` and replace with `jbj-monogram-nobuffer`
- `ProjectAIAnalyzer.tsx` already uses `nobuffer` (confirmed) -- verify all other usages
- `BrandMonogram.tsx` uses `transparent` for light backgrounds -- replace with `nobuffer`
- `BrandedLoader.tsx` uses separate dark/light variants -- verify they don't have the background issue

---

## 5. AI Intelligence Cards -- Premium Styling (Not Black)

**Problem:** Project Intelligence, Area Intelligence, Developer Intelligence cards are plain black. Need premium champagne/gold styling.

**Fix in `src/components/project-detail/ProjectAIAnalyzer.tsx`:**
- Change the card backgrounds from black/zinc to premium champagne gradient (`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]`)
- Use gold borders and text-black for content
- Apply same treatment to Area Intelligence and Developer Intelligence cards (identify their component files)

---

## 6. Payment Plan -- Fix Display When Data is Missing

**Problem:** For Valencia (and likely many projects), `payment_plan`, `payment_breakdown`, and `down_payment_percent` are all null. The Payment Plan section shows "Benefit from extended payment terms" but no actual plan structure.

### 6a. Enhance PaymentPlanVisualization fallback

**Fix in `src/components/project-detail/PaymentPlanVisualization.tsx`:**
- When all payment data is null, show a "Contact us for the payment plan" card instead of empty milestones
- Add a CTA button to register interest for payment plan details
- If only `paymentPlan` text exists (like "60/40"), the parser already handles it -- verify it works

### 6b. Trigger auto-enrichment for payment plans

- The `reelly-auto-enrich` edge function should extract payment plan data from Reelly API
- Run enrichment to populate `payment_plan` and `payment_breakdown` for all projects that have this data in Reelly

---

## 7. Amenities -- Show Photos from amenity_images

**Problem:** `amenity_images` is null for Valencia (and likely most projects). The `AmenitiesWithPhotos` component already supports photos via `amenityImages` prop but the data isn't there.

**Fix:**
- The `reelly-auto-enrich` edge function needs to extract `amenity_images` from Reelly API responses and store them in the `amenity_images` JSONB column
- The component code already handles displaying photos when available -- no frontend changes needed, just data enrichment

---

## 8. Scroll-Spy Tab Navigation Fix

**Problem:** The sticky tab navigation jumps erratically between sections. User wants organized sequential behavior.

**Fix in `src/components/project-detail/ProjectDetailLayout.tsx` (lines 257-274):**
- Current IntersectionObserver has `rootMargin: '-30% 0px -60% 0px'` which creates a narrow detection band
- Change to `rootMargin: '-20% 0px -70% 0px'` for a tighter top detection zone, preventing multiple sections from triggering simultaneously
- Add debouncing: only update `activeTab` if the new section is different from the current one AND is adjacent in the `visibleTabs` array (preventing jumps from AI Analyzer to Developer)

---

## 9. Registered Interest Form -- Wider + 3D Styling

**Problem:** The consultation/registered interest form looks too narrow and has the same flat styling as the mortgage section.

**Fix in `src/components/ConsultationRequestForm.tsx` (line 198):**
- Change `max-w-2xl` to `max-w-3xl` to widen the form
- Add 3D depth effect: `shadow-[0_12px_40px_rgba(200,167,102,0.4),0_4px_6px_rgba(0,0,0,0.1)]`
- Add a subtle `transform: perspective(1000px) rotateX(1deg)` CSS for 3D tilt effect
- Differentiate from mortgage with a thicker gold border (`border-3`) and slightly different gradient

---

## 10. Recommended Projects -- Premium "View All" Button

**Problem:** The "View All" link on recommended projects is barely visible (small gold text).

**Fix in `src/components/project-detail/RecommendedProjects.tsx` (lines 66-71):**
- Replace the small text link with a proper `Button` component using champagne gradient styling
- Use `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]` with gold border
- Make it larger and more prominent

### 10b. Fix "Recommended" badge color

**Fix in `src/components/project-detail/RecommendedProjects.tsx` (line 119):**
- Change `bg-gold/90 text-black` to the champagne gradient style: `bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-[#C8A766]/60`

---

## 11. Auto-Enrich Projects from Reelly

**Problem:** Many projects are missing payment plans, amenity images, construction progress data. User wants all projects fully enriched.

**Action:**
- Trigger the existing `reelly-auto-enrich` edge function in batches to enrich all projects
- Ensure the function extracts: payment_plan, payment_breakdown, amenity_images, construction_progress, documents, floor plans, and all other available Reelly data
- This is a backend operation -- no frontend code changes needed

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/components/home/HeroSearchBar.tsx` | Update currency toast text |
| `src/pages/Index.tsx` | Push hero content down with more padding |
| `src/components/MainLayout.tsx` | Hide chat widget on homepage first fold |
| `src/hooks/useAreaUnit.ts` | NEW -- global area unit hook (sqft/sqm) |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Wire area unit, fix scroll-spy debouncing |
| `src/components/project-detail/UnitInventorySection.tsx` | Wire area unit |
| `src/components/BrandMonogram.tsx` | Use nobuffer monogram |
| `src/components/project-detail/ProjectAIAnalyzer.tsx` | Premium champagne card styling |
| `src/components/project-detail/PaymentPlanVisualization.tsx` | Add fallback CTA when data missing |
| `src/components/ConsultationRequestForm.tsx` | Wider form, 3D effect |
| `src/components/project-detail/RecommendedProjects.tsx` | Premium View All button, champagne badge |
