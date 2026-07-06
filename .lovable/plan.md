## Plan

### 1. Fix upload reliability in the project wizard
- Replace the fragile multi-file upload behavior in the last-stage document uploader with a controlled sequential queue.
- Keep each file visible immediately with a real status: uploading, uploaded, failed, retry.
- Classify files correctly by filename/type:
  - fact sheet / brochure → brochure/fact sheet
  - floor plan → floor plan
  - payment plan → payment plan
  - photos/videos → gallery/media
  - other PDFs/docs → project documents
- Ensure uploaded files are not duplicated when the delayed upload response arrives.

### 2. Fix broken/blank preview frames
- Make the wizard preview use the uploaded cover and gallery URLs safely, with image fallback handling instead of a blank white frame.
- Add a real in-page full preview modal that opens instantly and shows:
  - hero image
  - gallery thumbnails/full gallery
  - bedrooms
  - size/built-up area
  - handover
  - price
  - documents count
  - premium payment plan summary
- Stop relying on the live project page as the only preview path.

### 3. Fix submit/publish wording and behavior
- For owner uploads, replace “sent/submitted for owner approval” language with “saved by owner” / “preview created”.
- Separate preview from publishing:
  - “Preview” opens a preview only.
  - “Publish” is the only action that should communicate live publishing.
- Keep the backend trust gate intact, but make the owner-facing UI truthful and not approval-based.

### 4. Persist all details into the project page correctly
- Ensure bedrooms from the pill selector are saved and displayed as Studio / 1BR / 2BR etc., not “TBA”.
- Save built-up/size data into fields the project detail page already reads, so the hero stats do not show “TBA” when size was entered.
- Carry gallery images, cover image, document records, and floor plan documents into the project detail page consistently.

### 5. Rewrite payment plan into premium visual presentation
- Add a deterministic payment-plan formatter that converts plain hints like “70/30 30% post handover…” into a cleaner display:
  - headline ratio
  - down payment / during construction / handover / post-handover milestones when detectable
  - premium short explanatory line
  - confirmation note for ambiguous or unverified parts
- Use this formatter in:
  - wizard side preview
  - full preview modal
  - project detail payment section
- Avoid dumping the user’s raw paragraph as the main visual output; keep raw text only as a secondary note when needed.

### 6. Wire brochure/fact sheet download correctly
- Treat uploaded fact sheet and brochure files as the primary source for “Download Brochure”.
- Route brochure/fact-sheet downloads through the existing backend download proxy with the correct filename and content type.
- Fix “file damaged / format not recognized” by ensuring the stored URL points to the actual uploaded file and the download response streams the original bytes.

### 7. Fix floor plan display and document library behavior
- Make uploaded floor-plan PDFs appear in the Floor Plans tab immediately.
- If a PDF cannot render inline, show a premium document panel with View and Download actions instead of an empty frame.
- Make document cards open a working viewer/download action, not a broken 404.
- Improve document cover selection:
  - City Buddy documents use the City Buddy image when present.
  - Other documents use a different uploaded project image when possible, not always the hero cover.
  - Fall back to a premium generated-style document cover only if no matching image exists.

### 8. Fix hero image darkness / marina visibility
- Adjust the project hero overlay so the marina/beachfront remains visible while keeping text readable.
- Use a lighter lower scrim and stronger text shadow instead of hiding the lower image content under a heavy black gradient.

### 9. Fix emerald contrast on affected backend/project sections
- Patch the known affected components directly:
  - floor plan file pills
  - payment tabs/buttons
  - same developer / same area map filters
  - map price markers
  - “more projects” action buttons
  - brochure/document buttons
- Add a scoped contrast lock for emerald action surfaces so text and icons render pure white on emerald/dark-gradient backgrounds.

### 10. Visual and technical validation
- Run an authenticated owner E2E flow with Playwright:
  - upload cover photo
  - upload multiple gallery images
  - upload multiple PDFs in the last-stage document area
  - finish/preview
  - open project detail
  - open gallery
  - open floor plans
  - download brochure/fact sheet
  - open project documents
  - inspect payment plan section
  - inspect map filters/markers and more-project buttons
- Capture screenshots for proof:
  - wizard upload queue
  - wizard preview/full preview
  - saved result screen
  - project hero with visible marina
  - gallery
  - floor plans
  - brochure section
  - payment plan section
  - project documents
  - map/nearby filters
  - same developer / same area sections
- Add a computed-style contrast scanner for dark text/icons on emerald surfaces and only report success after the scanner and screenshots pass.

## Technical details
- Main files to change after approval:
  - `src/pages/developer-hub/DeveloperProjectWizard.tsx`
  - `src/hooks/useDeveloperAutoPublish.ts`
  - `supabase/functions/developer-auto-publish/index.ts`
  - `src/pages/ProjectDetail.tsx`
  - `src/components/project-detail/ProjectDetailLayout.tsx`
  - `src/components/project-detail/FloorPlanGallery.tsx`
  - `src/components/project-detail/PremiumBrochureCard.tsx`
  - `src/components/project-detail/BookStyleDocuments.tsx`
  - `src/components/project-detail/PaymentPlanVisualization.tsx`
  - `src/components/project-detail/ProjectNearbyPropertiesMap.tsx`
  - `src/components/project-detail/MoreFromDeveloperStrip.tsx`
  - `src/index.css`
- Backend/data changes may be added only if needed to store missing size, bedroom, document role, display title, or document cover metadata safely.
- No unrelated security findings, public-site redesign, or non-owner backend areas will be changed.