

## Stamp Generator Fixes, Export Overhaul, Welcome Modal & Auth Session Improvements

This plan addresses all reported issues across the stamp generator, export system, welcome modal, and auth persistence.

---

### 1. Stamp Generator — Color Revert Button

**File: `StampGeneratorPage.tsx`**
- Add a "Reset to Standard" button in the Colors tab that reverts all 3 color stops to the default Ink Blue palette (`#1B3A8C` / `#1a2d6e` / `#1B3A8C`)
- Position it prominently above the palette presets section

---

### 2. Quick Download Fix — Multi-Select Colors Then Download

**File: `StampExportPage.tsx`**
- Current behavior: clicking a color swatch in "Quick Download in Color" triggers an immediate download — user reports this fails
- Fix: Convert to a **multi-select** interface (checkmarks on swatches), then a single "Download Selected" button generates all selected color PNGs
- Add "Select All" / "Deselect All" toggles
- Ensure the download logic handles errors gracefully with retry

---

### 3. Full Export Pack — All Backgrounds × All Formats

**File: `StampExportPage.tsx`**
- Expand the Multi-Color Pack to include **Navy, Black, Gold, White** backgrounds by default (pre-selected)
- Add all file format options: **PDF, PNG, JPG, SVG, WEBP** per color
- Add a toggle for "Individual download" mode vs "Full ZIP pack"
- The ZIP should contain folders: `navy/`, `black/`, `gold/`, `white/` each with all formats

---

### 4. Upload & Edit Existing Stamp

**File: `StampExportPage.tsx` or new section in `StampGeneratorPage.tsx`**
- Add an "Upload Stamp" option that accepts SVG/PNG
- For SVG: parse and identify text fields, colors, borders — highlight them for editing
- For PNG: display as-is with overlay editing (position, scale)
- Allow deleting/editing detected fields

---

### 5. Standard Design — Always First, Always Visible, Locked

**File: `StampGeneratorPage.tsx`**
- Generate the "Owner Official Standard" stamp using `generateOfficialStampSVG()` from `stampOfficialTemplate.ts` and **always** pin it as the first concept with a 🔒 "Standard" badge
- Label remaining concepts as "Generated"
- On "Regenerate": move current generated concepts to a "History" tab, generate new ones, but **never** remove the standard or favorites
- Add a "History" sub-tab in the concepts rail showing previously generated batches with Favorite/Adopt/Draft actions

---

### 6. Layout Rebalance — 60/20/20

**File: `StampGeneratorPage.tsx`**
- Change from current `w-[240px] | flex-1 | w-[340px]` to:
  - Left sidebar (controls): `w-[220px]` (~20%)
  - Center preview: `flex-1` (~60%) — already dominant but ensure minimum sizing
  - Right concepts: `w-[240px]` (~20%) with **vertical scroll, single column** layout for concepts
- Make concept cards smaller and stack vertically instead of a 2-3 column grid

---

### 7. SVG Text Flipping Fix — English Bottom Arc

**Files: `stampOfficialTemplate.ts`, `ai-stamp-generator/index.ts`**

**Root cause**: The `renderBottomArcText` / `bottomArcTextChars` functions position characters along the bottom arc using angular degrees. The character order combined with rotation causes letters to appear reversed when the spread angle is large.

**Fix**:
- In `renderBottomArcText` (client): iterate characters from the **end** to start when placing on the bottom arc, so the visual left-to-right reading order is preserved. Currently characters at index 0 go to the leftmost position on the arc, but with bottom arcs, the leftmost position should display the last character for correct reading direction.
- Actually the issue is simpler: the arc goes from left→right along the bottom, but the rotation `deg - 90` causes mirroring. Fix: reverse the character array before positioning, or adjust the angle calculation to go clockwise from the correct starting point.
- Apply the same fix in `bottomArcTextChars` in the edge function
- Enforce a `safeArc` of 60% (down from 65%) to add more clearance

---

### 8. Inner Circle Color Matching

**Files: `stampOfficialTemplate.ts`, `ai-stamp-generator/index.ts`**
- The center circle stroke uses `C_SEC` (secondary token) — this is correct for tinting
- The monogram text uses `C_ACC` — also correct
- **Bug**: The center circle and location ring are hardcoded with fixed opacity/colors that don't update when the user changes colors
- Fix: ensure the center circle, location text, and all inner elements use the correct color tokens (`C_SEC` for structural, `C_ACC` for content) so `StampSVGRenderer` tinting applies uniformly

---

### 9. Text & Separator Clearance — No Border Touching

**Files: `stampOfficialTemplate.ts`, `ai-stamp-generator/index.ts`**
- Reduce `safeArc` multiplier from 0.65 to **0.58** for company name arcs
- Add explicit padding: `textArcR` should be `(outerR + innerR) / 2` with a clamp ensuring at least **5px** clearance from both outer and inner ring strokes
- For separators at 3 & 9 o'clock: place them at `textArcR` but clamp the font-size to ensure they don't touch rings
- Location text: reduce `locArcLen` multiplier from 0.70 to **0.60** and enforce clearance from center circle
- In edge function `bilingualCircularStamp`: apply same clearance rules

---

### 10. Export Pack Button Fix

**File: `StampGeneratorPage.tsx`**
- The "Export Pack" button in the header navigates to `/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`
- If `savedDesignId` is null and `selectedId` is a client-generated ID (not a DB UUID), the export page can't find the design
- Fix: before navigating, ensure the design is saved to DB first (insert if needed), then navigate with the DB ID

---

### 11. Welcome Modal — Remove "Continue as Guest"

**File: `WelcomeModal.tsx`**
- Remove the `handleContinueAsGuest` function and the "Continue as Guest" button entirely
- Keep only the "Sign In / Create Account" button
- Update the dialog so closing it also redirects to `/auth` (since guest access is no longer permitted)

**File: `Auth.tsx`**
- Remove the "Continue as Guest" button and related text from the auth page

---

### 12. Auth Session Persistence Fix

**File: `AuthContext.tsx` / `AuthGate.tsx`**
- Investigate why users are being logged out when switching tabs
- The Supabase client already has `persistSession: true` and `autoRefreshToken: true`
- Likely issue: the `onAuthStateChange` listener fires `SIGNED_OUT` events during tab switches due to token refresh failures
- Fix: add resilience in the auth context — on `TOKEN_REFRESHED` failure, retry before clearing session; on `SIGNED_OUT`, check if it was user-initiated vs automatic
- Add a grace period before redirecting to `/auth` on session loss

---

### 13. Mobile Hamburger Cleanup

**File: `GlobalHeader.tsx` or mobile nav component**
- Remove the monogram logo below "Sign Out" in the mobile hamburger dropdown
- Remove the duplicated "Sign Out" that appears above "App and Navigation Guide"
- Keep only the Sign Out inside the account/profile section
- End the hamburger menu at the divider below Sign Out (no extra space/logos below)
- Verify all pages/routes from the footer and sidebar are present in the hamburger menu

---

### 14. Edge Function Model Upgrade

**File: `supabase/functions/ai-stamp-generator/index.ts`**
- Upgrade refine model from `google/gemini-3-flash-preview` to `google/gemini-3.1-pro-preview` for better SVG quality
- Add stricter SVG validation rules in the system prompt:
  - "Text must NEVER touch or overlap border circles"
  - "Bottom arc English text must read left-to-right naturally"
  - "Maintain minimum 5px clearance between all text and ring strokes"
  - "All color tokens must use: Primary=#1a2744, Secondary=#2a3a5c, Accent=#8b6914"
- Apply the same `bottomArcTextChars` fix for reversed text
- Redeploy the edge function

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/stamp-generator/StampGeneratorPage.tsx` | Revert button, layout 60/20/20, standard pin, history tab, export fix |
| `src/components/stamp-generator/StampExportPage.tsx` | Multi-select quick download, full pack with all formats/backgrounds |
| `src/lib/stampOfficialTemplate.ts` | Bottom arc text fix, clearance enforcement, color token consistency |
| `supabase/functions/ai-stamp-generator/index.ts` | Bottom arc fix, clearance, model upgrade, stricter prompt |
| `src/components/WelcomeModal.tsx` | Remove guest option |
| `src/pages/Auth.tsx` | Remove guest button |
| `src/contexts/AuthContext.tsx` | Session persistence resilience |
| `src/components/GlobalHeader.tsx` (mobile nav) | Remove duplicate sign-out, remove monogram below sign-out |

