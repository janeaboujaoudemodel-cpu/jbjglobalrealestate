

# Smart Listing Creator: Scroll Fix, Session Persistence, and Loading Upgrade

## Problem Summary

Three critical UX issues on the Smart Listing Creator page (`/listing-portal/submit`):

1. **Scroll jumps to footer** when clicking "Extract with AI" — should stay at/scroll to the Smart Listing Creator section
2. **Refresh loses progress** — user is reset to the beginning instead of returning to where they were
3. **Loading animation is generic** — uses a spinning wand icon instead of the branded JBJ monogram

---

## 1. Fix Scroll Behavior on AI Extraction

**File: `src/pages/ListingPortalSubmit.tsx`**

- Add a `ref` (`creatorRef`) to the main Smart Listing Creator container (the `max-w-3xl` div)
- After `setPhase('extracting')` in `runAIExtraction()`, call `creatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })` with a small offset for the header
- Apply the same scroll-to-top-of-creator logic in every phase transition (`setPhase(...)`) using a `useEffect` that watches `phase` changes
- This ensures the user always sees the active section, never the footer

---

## 2. Session Persistence on Refresh

**File: `src/pages/ListingPortalSubmit.tsx`**

- On every phase change, save the current state to `sessionStorage`:
  - `phase` (current step)
  - `form` (all form fields)
  - `listingCategory`
  - `uploadedImageUrls` (already-uploaded image URLs)
  - `extractedData`
  - `pricePrediction`
  - `sellerRole`, `contactMode`
- On component mount, check `sessionStorage` for saved state and restore it
- Clear `sessionStorage` on successful submission (`phase === 'success'`)
- Note: uploaded `File` objects cannot be serialized, but the already-uploaded URLs and extracted data will persist

---

## 3. Replace Loading Animation with Branded Monogram

**File: `src/pages/ListingPortalSubmit.tsx`**

Replace the extracting phase loading UI (lines 650-674) — currently a spinning border with a `Wand2` icon — with:
- The JBJ monogram image (`jbj-monogram-light-transparent.png`) with a `pulse` animation and gold drop-shadow (matching `BrandedLoader`)
- Text: "AI is analyzing your documents..."
- Keep the step badges below but style them with the gold theme
- Apply the same monogram treatment to the submitting phase (lines 1218-1230)

---

## Technical Execution Order

1. Add `useRef` for the creator container and scroll-into-view logic on phase changes
2. Add `sessionStorage` save/restore for form state and phase
3. Replace the extracting/submitting loading animations with the branded monogram
4. All changes in a single file: `src/pages/ListingPortalSubmit.tsx`

