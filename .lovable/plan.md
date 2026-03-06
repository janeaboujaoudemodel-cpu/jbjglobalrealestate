

## Plan: Fix Listing Admin Cards, Flyover, Broken Images & Register Interest CTAs

### Issues Identified

1. **Approve/Reject on outside cards** — Already exists (lines 446-466 of PendingImportCard). Working correctly. Inside preview also has approve/reject in the admin bar (lines 557-588 of PendingImportPreview). Both are functional.

2. **"View listing should fit inside the box"** — The PendingImportPreview renders `ProjectDetailLayout` full-width. It needs to be contained within a bordered card/box so it looks like a preview, not a live page.

3. **AMRA broken photo** — `SafeImage` referrer policy was already changed to `strict-origin-when-cross-origin`. The remaining issue is likely that AMRA images use `/_next/image` proxy URLs from CitiDeveloper that need normalization, or the cover_image_url in the DB points to a dead URL. Will add robust fallback handling.

4. **Location Flyover not working** — The flyover code looks correct but may fail silently if Leaflet's `flyTo` encounters issues with the map not being ready, or if `hasFlown.current` isn't properly reset. The main fix: add a proper reset mechanism and ensure the map is fully loaded before starting. Also need to add the requested red circle + premium SVG pin that vanishes.

5. **Missing brochure/payment plan → "Register Interest" CTA** — Currently the brochure section shows "Unlock Brochure" with a lock icon when no brochure exists. Payment plan section shows a generic "Contact us" message when empty. Both need proper "Register Your Interest" CTAs that capture the lead with `project_id` context.

---

### Implementation

#### 1. Preview Listing Fits Inside Box
**File:** `src/pages/listing-admin/PendingImportPreview.tsx`
- Wrap the `ProjectDetailLayout` render in a contained box: `max-h-[80vh] overflow-y-auto border border-gold/30 rounded-xl` within the page
- Keep the admin bar sticky above the contained preview
- This makes it clear it's a preview, not the live page

#### 2. Fix Location Flyover
**File:** `src/components/project-detail/ProjectLocationFlyover.tsx`
- Fix the `hasFlown` ref reset: ensure it resets properly when replay is triggered
- Add `whenReady` check on the map before starting animation
- Add a red pulsing circle (Leaflet `CircleMarker`) around the project at step 3
- Replace the default blue marker with a premium gold/red SVG location pin using `L.divIcon`
- Add a fade-out animation for the pin after the flyover completes (step 4 → pin fades over 2s)
- Increase the initial hold at UAE zoom to 3s for better "overview" feeling

#### 3. Fix Broken Hero/Gallery Images (AMRA)
**File:** `src/components/SafeImage.tsx`
- Add an `onLoad` check: if the image's `naturalWidth === 0`, trigger fallback
- For `/_next/image` URLs, attempt to decode the inner `url` param and use that directly

**File:** `src/lib/imageUtils.ts`  
- Add `normalizeNextImageUrl()` that extracts the original URL from `/_next/image?url=...` proxy patterns

#### 4. Register Interest CTA for Missing Brochure
**File:** `src/components/project-detail/ProjectDetailLayout.tsx`
- When `brochurePrimary` is null: replace the "Unlock Brochure" card with a premium "Register to Receive Brochure" CTA
- The CTA opens `LeadCaptureModal` with `documentType="brochure"` and `projectId`
- Text: "Register your details to receive the exclusive brochure for [Project Name]"

#### 5. Register Interest CTA for Missing Payment Plan  
**File:** `src/components/project-detail/PaymentPlanVisualization.tsx`
- When `milestones.length === 0 && !paymentPlan`: replace the generic text with a premium "Register Your Interest" CTA button
- Add `onRegisterInterest` callback prop that the parent (`ProjectDetailLayout`) connects to `LeadCaptureModal` with `documentType="payment_plan"`
- Text: "Register your interest to learn about the payment plan from our team"

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`
- Pass `onRegisterInterest` to `PaymentPlanVisualization` that opens the lead capture modal with payment_plan context
- Ensure the captured lead includes `project_id` so the admin knows which project the user was interested in

#### 6. Lead Capture Source Tracking
**File:** `src/components/project-detail/LeadCaptureModal.tsx`
- Already captures `projectId` and `documentType` — verify these flow into the `leads` table with a `source` like `register_interest` and `project_id` reference
- No major changes needed, just ensure the source is set correctly

---

### Files Modified
- `src/pages/listing-admin/PendingImportPreview.tsx` — contained preview box
- `src/components/project-detail/ProjectLocationFlyover.tsx` — fix flyover + red circle + premium pin + vanish
- `src/components/SafeImage.tsx` — `/_next/image` URL normalization
- `src/lib/imageUtils.ts` — `normalizeNextImageUrl()` helper
- `src/components/project-detail/ProjectDetailLayout.tsx` — brochure register CTA + payment plan callback
- `src/components/project-detail/PaymentPlanVisualization.tsx` — register interest CTA when no plan

