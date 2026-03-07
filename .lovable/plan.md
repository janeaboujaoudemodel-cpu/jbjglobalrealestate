

# Plan: Recently Searched Walking Strip, Register Interest Modal, AI Signature Fixes, Frontend Card Update Display

## 5 Areas of Work

---

### 1. Recently Searched Cards — Walking Strip with Gold Arrows

**Current**: `ContinueSearching.tsx` has a basic auto-scrolling strip with fade edges but no navigation arrows.

**Changes in `ContinueSearching.tsx`**:
- Add left/right gold arrow buttons (similar to book marquee) with champagne-gold fill, gold border, positioned at strip edges
- Arrows: circular buttons with `ChevronLeft`/`ChevronRight`, gold border, champagne gradient fill, `onClick` scrolls the strip by one card width
- Keep existing auto-scroll walking strip behavior (pause on hover)
- Style arrows: `bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40` with gold icon color

---

### 2. Fix "Register Your Interest" — Open Modal Instead of Scrolling/Redirecting

**Problem A**: In `ContinueSearching.tsx` line 90, the "Register Your Interest" button redirects to `/contact` page.
**Problem B**: In `ProjectDetailLayout.tsx`, the hero "Register Interest" button calls `scrollToInquiry` which scrolls to the bottom form — user wants an immediate in-page modal.

**Changes**:
- **`ContinueSearching.tsx`**: Replace `<Link to="/contact">` with an `onClick` that opens a `LeadCaptureModal` (reuse existing component). Add local state for `leadCaptureOpen`. Wire the modal with `source: "recent_searches_cta"`.
- **`ProjectDetailLayout.tsx`**: Change the hero "Register Interest" button and the sticky nav "Register Interest" button to open a `LeadCaptureModal` instead of scrolling to inquiry form. The modal should use `documentType: "brochure"` as a generic interest capture (not claiming a payment plan is available). Keep the bottom `ProjectInquiryForm` as-is for those who scroll down.
- **`PaymentPlanVisualization.tsx`**: When no payment plan data exists, change wording from "Register your interest to receive the exclusive payment plan details" to "Register your interest to learn more about {projectName}. Our team will provide you with the latest details." — remove misleading "payment plan" promise.

---

### 3. AI Signature Designer — Major Overhaul

**3A. Deploy Edge Function**: Add `[functions.ai-signature-generator]` with `verify_jwt = false` to `supabase/config.toml`.

**3B. Expand Ink Colors** in `AISignatureDesigner.tsx`:
- Add website palette colors: Gold Champagne (`#C8A766`), Pearl (`#F5F0E6`), Dark Gold (`#9A7B3C`), Rose Gold (`#B76E79`), Platinum (`#8E8E8E`)
- Add a color wheel input (`<input type="color">`) for custom colors
- Total: 10+ preset swatches + custom picker

**3C. Remove Underline** from `generateSignature`: Delete the underline flourish code (lines 122-137 in AISignatureDesigner).

**3D. Generate 10 Signatures (5 per row)** with multiple styles:
- Styles: Full name cursive, Full name bold, Initials only (e.g. "JB"), Initials with dots (e.g. "J.B.J."), First name only, Monogram style, etc.
- Generate 10 variations using combinations of fonts × styles
- Display in `grid-cols-5` (2 rows of 5)
- Unlimited regeneration (button always visible)

**3E. Favorite/Heart** on generated signatures:
- Add a heart icon overlay on each signature card
- Toggle favorite state, store in `ai_tool_projects` with metadata `{ favorite: true }`
- Show favorites section separately

**3F. Upload Signature/Photo + Company Stamp**:
- Add a third tab "Upload" alongside "AI Generate" and "Draw"
- File input for signature image upload with crop functionality (use canvas-based cropping)
- Separate section for company stamp upload with crop
- Save uploaded assets to the same `ai_tool_projects` table with type `"uploaded_signature"` or `"uploaded_stamp"`

**3G. Fix forwardRef warning**: `ESignaturePad` is a function component receiving a ref. Either wrap with `forwardRef` or remove the ref usage in `AISignatureDesigner`.

---

### 4. Frontend Project Cards — Show Only "Updated" Date, Not Edit Details

**Current**: The previous task added detailed edit logs to project cards in the admin. The user clarifies: frontend cards should only show a simple "Updated [date]" without listing what was changed. The detailed audit log is backend-only.

**Changes in `ProjectCard.tsx`**:
- Add a small "Updated [relative date]" text below the description, using the project's `updated_at` field
- No mention of specific fields changed — just the date
- Keep detailed edit logs only in `ListingAdmin.tsx` (already done)

---

### 5. LeadCaptureModal Improvements

The existing `LeadCaptureModal` says "Download [document type]" which is misleading when no document exists. 

**Changes in `LeadCaptureModal.tsx`**:
- When `documentUrl` is undefined/null, change title from "Download Payment Plan" to "Register Your Interest"
- Change button text from "Get Payment Plan" to "Submit Interest"
- Change success message from "Your download is ready" to "Thank you! Our team will contact you shortly"
- Only show download-specific language when `documentUrl` is actually provided

---

## Files to Modify

1. **`supabase/config.toml`** — Add `ai-signature-generator` function config
2. **`src/components/ContinueSearching.tsx`** — Add gold navigation arrows + LeadCaptureModal instead of redirect
3. **`src/components/project-detail/ProjectDetailLayout.tsx`** — Register Interest opens modal instead of scrolling
4. **`src/components/project-detail/PaymentPlanVisualization.tsx`** — Fix misleading payment plan text
5. **`src/components/project-detail/LeadCaptureModal.tsx`** — Context-aware labels (download vs interest)
6. **`src/components/e-signature/AISignatureDesigner.tsx`** — Major overhaul: 10 signatures, colors, favorites, upload, no underline
7. **`src/components/e-signature/ESignaturePad.tsx`** — Fix forwardRef warning
8. **`src/components/ProjectCard.tsx`** — Add simple "Updated [date]" display

