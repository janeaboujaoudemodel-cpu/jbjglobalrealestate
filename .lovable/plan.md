

## Project Detail Page Overhaul - Reelly-Style Enhancements

This is a large set of improvements to the project detail page. Given the scope, this plan focuses on the highest-impact changes that can be implemented together.

### 1. Disable Scroll Wheel Zoom on Map (Prevent Accidental Zoom)

**Problem:** Two-finger scrolling on the map triggers zoom in/out, disrupting page scrolling.

**Solution:** Add a "Click to enable map" overlay pattern (as shown in the Reelly reference image). The map loads with `scrollWheelZoom={false}` and shows an overlay. Clicking the overlay enables scroll zoom. This prevents accidental zoom while scrolling the page.

**File:** `src/components/project-detail/ProjectLocationMap.tsx`
- Set `scrollWheelZoom={false}` on `MapContainer`
- Add a transparent overlay with "Click to enable map" text
- On click, remove overlay and enable scroll zoom via `map.scrollWheelZoom.enable()`

---

### 2. "Nearby Points of Interest" Section Below Map

**Problem:** The location distances (e.g., "Downtown Dubai 18.8 km") exist but are displayed above the map. The reference shows them styled as a "Nearby" list below the map with place name on the left and distance on the right.

**Solution:** Restructure the Location section to: Location heading with address, then Map, then "Nearby" points of interest list below the map in a clean two-column format (place name left, distance right).

**File:** `src/components/project-detail/ProjectDetailLayout.tsx` (lines 900-974)
- Move `location_distances` rendering from above the map to below it
- Restyle as a clean list with place name on left, distance (km) on right

**File:** `src/components/project-detail/PointsOfInterest.tsx`
- Restyle to show a simple list: place name on left, distance on right (matching reference)

---

### 3. "Report an Issue" Banner (Reelly-Style Yellow Banner)

**Problem:** Currently a small text link. The reference shows a prominent yellow banner: "Noticed something incorrect? Help us keep this project up to date" with a "Report an issue" button that opens a modal.

**Solution:** Replace the simple text link with a styled banner and add a proper report modal with issue type selection.

**File:** `src/components/project-detail/ReportIssueButton.tsx`
- Redesign as a full-width yellow/amber banner with warning icon
- Add a modal (Dialog) with issue type dropdown: Incorrect Price, Incorrect Availability, Incorrect Payment Plan, Updated Project Information, Other
- Include a text area for details
- Submit saves to a `project_reports` table (new)

**File:** `src/components/project-detail/ProjectDetailLayout.tsx`
- Position the banner prominently (above amenities section, matching reference placement)

---

### 4. Recommended Projects Cards - Reelly Style

**Problem:** Current cards show basic info. Reference shows: status badge (On Sale), handover date (Q1 2028), "Advised" badge on top of image; developer logo overlaid at bottom of image; project name, area, developer below; price from and payment plan at bottom.

**Solution:** Redesign the recommended project cards to match the reference layout.

**File:** `src/components/project-detail/RecommendedProjects.tsx`
- Add top badges row: sale status pill, handover date pill, "Recommended" badge (gold instead of purple)
- Overlay developer logo at bottom-left of image (small rounded square)
- Below image: project name, location, developer name
- Bottom row: "Price from X AED" on left, "Payment plan 60/40%" on right with info icon

---

### 5. Master Plan Section - Maximize/Enlarge Button

**Problem:** The master plan image exists but lacks a maximize button to view it larger, as shown in the reference.

**Solution:** Add a maximize icon button on the master plan image that opens it in a full-screen lightbox or new tab.

**File:** `src/components/project-detail/MasterPlanSection.tsx`
- Add a `Maximize` icon button (top-right corner of image)
- On click, open the image in a new tab at full resolution

---

### 6. Description - Remove "Project General Facts" Label

**Problem:** User wants the description to show immediately without a section heading like "Project General Facts".

**Solution:** The current code already renders the description directly under "Details" heading. Verify and ensure no "Project General Facts" label exists. The description content flows naturally after the quick facts bar.

**File:** `src/components/project-detail/ProjectDetailLayout.tsx` - Verify only (likely no change needed)

---

### 7. Payment Plan - Two Options Display (100% and Installment)

**Problem:** Reference shows two payment plan options side by side: "100%" (full payment) and the installment plan (e.g., "60/40"). The current implementation only shows the installment breakdown.

**Solution:** Add a "100% Payment" option alongside the installment plan in a tab or card layout.

**File:** `src/components/project-detail/PaymentPlanVisualization.tsx`
- Add a two-tab layout: "Full Payment (100%)" and "Payment Plan (60/40)"
- Full payment tab shows a simple "Pay 100% upfront" card
- Installment tab shows the existing breakdown with the colored progress bar
- Add "On Booking / During Construction / On Handover" labels matching the reference style

---

### Summary of All Files

| File | Change |
|------|--------|
| `src/components/project-detail/ProjectLocationMap.tsx` | Disable scroll zoom, add "Click to enable" overlay |
| `src/components/project-detail/ProjectDetailLayout.tsx` | Move POI below map, position Report banner, verify description |
| `src/components/project-detail/PointsOfInterest.tsx` | Restyle as clean distance list |
| `src/components/project-detail/ReportIssueButton.tsx` | Redesign as yellow banner with report modal |
| `src/components/project-detail/RecommendedProjects.tsx` | Add status/handover/advised badges, developer logo overlay, payment plan |
| `src/components/project-detail/MasterPlanSection.tsx` | Add maximize button on image |
| `src/components/project-detail/PaymentPlanVisualization.tsx` | Add 100% vs installment tab layout |

### Database Migration

A new `project_reports` table to store user-submitted issue reports:

```text
project_reports (
  id uuid PK,
  project_id text NOT NULL,
  issue_type text NOT NULL,
  description text,
  reporter_email text,
  created_at timestamptz DEFAULT now()
)
```

With RLS allowing anonymous inserts (public-facing feature) and admin-only reads.

