

## Plan: Fix E-Signature Bugs, Listing Generator Multi-Project URL Support, and Runtime Error

This plan addresses three distinct problem areas: (1) E-Signature workflow bugs, (2) Listing Generator stuck on "Analyzing Documents" and missing multi-project URL support, and (3) a runtime error from `useRecentSearches`.

---

### Problem 1: E-Signature Issues

**Bugs identified:**
- **No saved user info**: Recipients must re-enter name, email, phone every time. No persistence.
- **Document preview not centered**: The `SignDocument.tsx` page shows a simple card layout but the PDF preview is behind a "View PDF" button that opens in a new tab — there is no inline centered preview.
- **Scroll sensitivity**: The `CreateEnvelope` page uses default browser scroll which can trigger horizontal scroll (likely from the `DocumentFieldPlacer` iframe + overlay layout at 780px fixed height).
- **Console warning**: `Dialog` component in `ListingGenerator` is receiving a ref it cannot accept (line 491).

**Fixes:**

#### 1a. Save & Auto-Fill User Info (E-Signature)
**File:** `src/pages/e-signature/CreateEnvelope.tsx`
- On mount, load sender's saved contacts from `localStorage` key `esign_saved_contacts`.
- When user fills recipients and submits, save recipient entries (name, email, phone) to localStorage.
- On Step 2 (Add Recipients), show a "Previously Used" dropdown/autocomplete that suggests saved contacts when typing in name or email fields.
- This way the user never has to re-type frequently used recipients.

#### 1b. Center Document Preview in SignDocument
**File:** `src/pages/e-signature/SignDocument.tsx`
- Add an inline iframe/embed showing the PDF document centered in the page, above the signature pad.
- Use `<iframe src={document_url} className="w-full h-[60vh] border rounded-xl" />` with `mx-auto` centering.
- Keep the "View PDF" download button as secondary action.

#### 1c. Fix Scroll Sensitivity in DocumentFieldPlacer
**File:** `src/components/e-signature/DocumentFieldPlacer.tsx`
- Add `overscroll-behavior: contain` and `overflow-x: hidden` to the main container to prevent horizontal scroll leaking.
- Add `touch-action: pan-y` on the document overlay to prevent unintended horizontal panning on touch devices.
- Wrap the entire component in a container with `overflow-x-hidden` to contain horizontal scroll within the component.

#### 1d. Fix Dialog Ref Warning in ListingGenerator
**File:** `src/components/listing-admin/ListingGenerator.tsx` (line 491)
- The `<Dialog>` component is being used without `<DialogTrigger>` which causes the ref warning. Wrap or use the `open`/`onOpenChange` pattern correctly (it's already using controlled mode, so the fix is to ensure no extra children are triggering ref issues).

---

### Problem 2: Listing Generator — Slow Extraction + Multi-Project URL Support

**Bugs identified:**
- The edge function `generate-listing` uses `google/gemini-2.5-pro` which is slow for large payloads. The frontend shows "Analyzing Documents" indefinitely when the AI call takes >30s.
- The function only extracts ONE project — if a URL contains multiple projects, they all merge into a single listing.
- The session replay confirms the user uploaded content about "Amra Wellness Resort" with inventory for Towers A-D, and the system hung on "Analyzing Documents".

**Fixes:**

#### 2a. Add Timeout + Progress Feedback
**File:** `src/components/listing-admin/ListingGenerator.tsx`
- Add a timeout countdown (e.g. "Processing... ~20s remaining") to give user feedback.
- If the call takes >60s, show a retry button instead of spinning forever.
- Add `AbortController` with a 90s timeout on the `supabase.functions.invoke` call.

#### 2b. Multi-Project Extraction from Single URL
**File:** `supabase/functions/generate-listing/index.ts`
- Change the tool schema from `extract_project` (single object) to `extract_projects` (returns an array of projects).
- The AI prompt must instruct: "If the content contains multiple distinct projects, return each as a separate entry in the array. Do NOT merge different projects together."
- Frontend receives an array of extracted projects.

#### 2c. Frontend: Handle Multiple Extracted Projects
**File:** `src/components/listing-admin/ListingGenerator.tsx`
- Change `extracted` state from `ExtractedData | null` to `ExtractedData[]`.
- On the preview step, show a tabbed or stacked view of each extracted project with individual "Save to Pending" buttons.
- Each project gets its own duplicate check.

#### 2d. Switch to Faster Model for Non-Vision Calls
**File:** `supabase/functions/generate-listing/index.ts`
- When only a URL is provided (no files/images), use `google/gemini-2.5-flash` instead of `gemini-2.5-pro` for faster text extraction.
- Keep `gemini-2.5-pro` only when image/PDF files are uploaded that need vision.

#### 2e. URL-Only Generation Flow
**File:** `src/components/listing-admin/ListingGenerator.tsx`
- Make "Generate Listing" work with URL-only input (currently it does, but ensure the UX is clear).
- When only URL is provided, show "Scraping website..." status instead of "Analyzing Documents".

---

### Problem 3: Runtime Error — Objects Rendered as React Children

**Error:** `Objects are not valid as a React child (found: object with keys {id, type, name, slug, imageUrl, subtitle, viewedAt})`

**Root cause:** Somewhere a `RecentItem` object from `useRecentSearches` is being rendered directly as a child instead of accessing its `.name` property. This is in the `ContinueSearching.tsx` component.

**Fix:**
**File:** `src/components/ContinueSearching.tsx`
- Audit the render output to find where a `RecentItem` object is accidentally used as JSX children instead of `item.name`.

---

### Files Modified/Created

1. **`src/pages/e-signature/CreateEnvelope.tsx`** — Add localStorage contact persistence + autocomplete suggestions
2. **`src/pages/e-signature/SignDocument.tsx`** — Add centered inline PDF preview
3. **`src/components/e-signature/DocumentFieldPlacer.tsx`** — Fix scroll containment
4. **`supabase/functions/generate-listing/index.ts`** — Multi-project extraction, faster model for URL-only, timeout handling
5. **`src/components/listing-admin/ListingGenerator.tsx`** — Multi-project UI, progress feedback, timeout, fix Dialog ref warning
6. **`src/components/ContinueSearching.tsx`** — Fix object-as-React-child runtime error

