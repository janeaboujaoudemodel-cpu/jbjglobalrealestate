

# Fix Plan: Multiple UI Issues

## 1. TrustBar Section Centering (Equal Spacing from Both Dividers)

**Problem:** The "Trusted By Thousands" section is too close to the developer marquee above and too far from the "Excellence Guaranteed" divider below. The four trust cards are not visually centered between the two dividers.

**File:** `src/pages/Index.tsx` (lines 214-230)

**Fix:** The trust bar container uses `py-12 md:py-16` but the inner "Trusted By Thousands" label has `mb-3` and "Excellence Guaranteed" has `mt-3`. These margins create the visual imbalance because the TrustBar component itself has its own internal padding (`py-6 md:py-8`). Equalize by:
- Removing the `mb-3` and `mt-3` on the divider labels and replacing with consistent spacing
- Ensuring the TrustBar has equal padding top and bottom relative to the two label dividers

---

## 2. "by" in Black, Developer Name in Gold (Globally)

**Problem:** In FeaturedListings and DeveloperLink, "by" is also styled gold along with the developer name. The user wants "by" in black/muted and only the developer name in gold.

**Files to change:**

**A. `src/components/ui/developer-link.tsx`** (lines 35-37 and 45-51)
- The `showPrefix` renders "by " inside the same `<span>` as the gold gradient text. Fix: render "by " outside the gold span, styled in a neutral dark color (e.g., `text-black` on light backgrounds or `text-muted-foreground`).

**B. `src/components/home/FeaturedListings.tsx`** (lines 226-235)
- Line 231: `by {project.developer_name}` -- the whole Link is gold. Fix: render "by " as a separate `<span className="text-black">` before the gold developer name.
- Line 234: Same fix for the non-link variant.

**C. Other files using inline "by" patterns:**
- `src/components/area-detail/AreaMapSection.tsx` (line 194): `by {project.developer_name}` all in zinc-500 -- this is fine (muted).
- `src/components/listing-admin/PendingImportCard.tsx` (line 371): admin panel, skip.
- `src/components/creative-suite/panels/PropertyPicker.tsx` (line 121): admin/tool, skip.

---

## 3. "...more" Next to Description Text (Not Below Handover)

**Problem:** In FeaturedListings cards, the "More" link appears at the bottom-right of the card under the handover date. The user wants "...more" to appear inline with the description text, and the handover date to move down separately.

**File:** `src/components/home/FeaturedListings.tsx` (lines 237-276)

**Fix:**
- The description block (lines 238-245) already has `...more` inline. Good.
- Remove the separate "More" link at lines 269-274 (the standalone `<Link>` at bottom-right).
- Rearrange the bottom section: Price on the left, Handover date on the right -- no "More" link at the bottom.

---

## 4. Developer Logo Full-Fit in DeveloperInfoCard

**Problem:** The developer logo in the project detail page's DeveloperInfoCard still shows white edges inside the gold border frame.

**File:** `src/components/project-detail/DeveloperInfoCard.tsx` (line 69)

**Fix:** Currently `object-contain p-1`. Change to `object-contain p-0` (remove all padding) so the logo fills the entire container edge-to-edge within the gold border.

---

## 5. Remove Developer Location (Keep "Headquarters" Label Only)

**Problem:** The DeveloperInfoCard shows the developer's headquarters location (e.g., "Headquarters: Dubai"). The user wants to remove the specific location text but keep the word "Headquarters" only if needed. Since the field `headquarters` contains the location itself, simply hide the entire headquarters row.

**File:** `src/components/project-detail/DeveloperInfoCard.tsx` (lines 85-90)

**Fix:** Remove or comment out the headquarters display block entirely.

---

## 6. Project Sticky Sub-Navigation Styling

**Problem:** The sticky sub-nav (Details, Gallery, Progress, Developer) has a gray background (`bg-zinc-900`) making it hard to read. Text is cropped/not fitting. Labels are hidden on mobile (`hidden md:inline`). Hover states are not premium.

**File:** `src/components/project-detail/ProjectDetailLayout.tsx` (lines 567-619)

**Fix:**
- Change background from `bg-zinc-900` to `bg-black` for solid contrast.
- Change tab text styling: inactive tabs use `text-gold/60` instead of `text-foreground`, active tabs use `text-gold bg-gold/10 border border-gold/30`.
- Remove `hidden md:inline` from tab labels so text is always visible (use smaller text on mobile: `text-xs md:text-sm`).
- Add `min-w-fit` to each button to prevent text cropping.
- Improve hover: `hover:text-gold hover:bg-gold/5`.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Equalize spacing around TrustBar section |
| `src/components/ui/developer-link.tsx` | "by" in dark color, only name in gold |
| `src/components/home/FeaturedListings.tsx` | "by" in black; remove bottom "More" link |
| `src/components/project-detail/DeveloperInfoCard.tsx` | Logo p-0; remove headquarters row |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Sticky nav: black bg, gold text, visible labels, no cropping |

