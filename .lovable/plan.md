

# Mobile UI and Data Quality Fix Plan

This plan addresses 7 distinct issues identified from your screenshots and feedback.

---

## Issue 1: Contact Cards Too Large and Stretched (Ready to Get Started Section)

**Problem:** The WhatsApp, Call, and Email cards in the "Ready to Get Started?" section are too tall and rectangular on mobile. The container stretches edge-to-edge.

**Fix:** In `CombinedContactNewsletter.tsx`:
- Reduce card padding from `p-4` to `p-3` on mobile
- Make the outer container have more horizontal margin on mobile (`mx-4 sm:mx-6` instead of `mx-2`)
- Reduce icon size from `w-12 h-12` to `w-10 h-10`
- Make cards horizontal (row layout) on mobile instead of stacked vertically, so they're more compact
- Apply the same fix to `DirectContactCTA.tsx` for the similar section on service pages

---

## Issue 2: Mobile Hamburger Menu - Logo Overlap Issue

**Problem:** The mobile menu header shows both the background header logo AND the menu's own "JBJ Global Real Estate" text, causing a double/overlapping logo effect (visible in IMG_0637 and IMG_0633).

**Fix:** In `GlobalHeader.tsx` (SheetContent header area, lines 654-669):
- Remove the monogram image (`jbjMonogramLightBg`) from the mobile menu header entirely
- Keep only the text "JBJ Global Real Estate" as the menu title
- This matches the "correct" state the user identified where no logo shows in the dropdown

---

## Issue 3: Split/Double Button on Property Page

**Problem:** The "List Your Property for Rent" button appears split with two parts (visible in IMG_0635) - the arrow + "List" text and "Your Property for Rent" appear as separate elements.

**Fix:** Find the component rendering this CTA on the rental/sell page and ensure the button is a single unified element with proper flex alignment, not split into two halves.

---

## Issue 4: Popups Opening All Together / Crowded

**Problem:** Chat widget, cookies consent, and lead capture all compete for screen space. Closing one opens another immediately.

**Fix:** In `PopupCoordinatorContext.tsx`:
- Add a delay between popup dismissals - when one popup is dismissed, wait 2-3 seconds before showing the next
- Reduce cookies banner size on mobile by making it more compact (smaller padding, shorter text)
- In `CookiesConsentBanner.tsx`: reduce mobile padding from `p-6` to `p-4`, use smaller text, stack buttons vertically on mobile

---

## Issue 5: Areas Page - "Provident Estate" Text Showing in Descriptions

**Problem:** Area descriptions in the database contain raw markdown like `![banner-bg - Provident Estate](https://...)` which renders as visible text on area cards (visible in IMG_0629). This is a compliance violation.

**Fix (Database + Code):**
- Create a database migration to clean all 15 affected area descriptions:
  - Strip the `![banner-bg - Provident Estate](...)` markdown image tags from descriptions
  - Remove any `providentestate.com` URLs from description text
  - Replace any remaining "Provident" or "Provident Estate" references with neutral text
- In `AreaGuides.tsx`: add a sanitization function that strips markdown image syntax and source brand names before rendering descriptions, as a safety net

---

## Issue 6: Areas Page - Empty Photos

**Problem:** 144 areas have no `image_url`, showing empty/placeholder cards.

**Fix:**
- For area cards with no image, ensure the gradient placeholder with MapPin icon renders properly (this already exists in code)
- The real fix is that area images should come from actual community/master plan photos, not individual project photos. This requires uploading proper area images or sourcing them from the sync engine. For now, ensure the placeholder is clean and professional.

---

## Issue 7: Cookie Consent - Backend Persistence

**Problem:** User wants cookie consent to be saved in the backend so there's proof the user agreed.

**Fix:**
- Currently cookies consent is saved only in `localStorage`
- Add a database table `cookie_consents` to store: visitor_id (or fingerprint), consent_status, preferences (JSON), timestamp, IP/user-agent
- When user accepts cookies, save to both localStorage AND the database
- This creates an auditable record of consent

---

## Technical Summary

### Files to Modify:
1. `src/components/CombinedContactNewsletter.tsx` - Compact contact cards
2. `src/components/DirectContactCTA.tsx` - Same compact treatment
3. `src/components/GlobalHeader.tsx` - Remove logo from mobile menu header
4. `src/components/CookiesConsentBanner.tsx` - Smaller on mobile, add DB persistence
5. `src/contexts/PopupCoordinatorContext.tsx` - Add dismissal delay
6. `src/pages/AreaGuides.tsx` - Add description sanitizer

### Database Changes:
1. Migration to clean area descriptions (remove Provident/markdown artifacts)
2. New `cookie_consents` table for audit trail

### Components to Identify and Fix:
- The rental/sell page CTA button that appears split (need to locate the exact component)

