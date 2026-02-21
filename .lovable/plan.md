
# Comprehensive Fix: Founder Sidebar, Project Count, Alerts UI, Seller Listing Sale/Rent, and Champagne Theme

## Overview
This plan addresses all outstanding issues: the Founder section placement in the sidebar, inaccurate project counts, alerts dropdown styling, the Seller Listing page needing a sale/rent selection step, and enforcing the Champagne Gold UI standard across remaining pages.

---

## 1. Founder Section in Sidebar - Move Next to Podcast Studio

**Problem:** The "Founder & Podcast" nav item exists under a separate "FOUNDER" section at the bottom of the sidebar, far from the "Studio" item. It's hard to find.

**Fix in `OwnerSidebarNav.tsx`:**
- Move the Founder & Podcast item into the "CREATIVE" section, right after "Studio"
- Add a second item "Podcast Controls" with a Mic icon for direct access
- Remove the standalone "FOUNDER" section
- Result: The CREATIVE section becomes:
  - Studio
  - Founder & Podcast (with User icon)
  - Kanban Board
  - Marketing Hub

---

## 2. Total Projects Count - Show Accurate Published Count

**Problem:** The Admin Overview Dashboard shows 2,525 total projects, but the database has only 1,849 published. The query counts ALL projects including unpublished/pending ones.

**Fix in `AdminOverviewDashboard.tsx`:**
- Change the projects query from:
  ```
  supabase.from("projects").select("id", { count: "exact", head: true })
  ```
  to:
  ```
  supabase.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true)
  ```
- Update the label from "Total Projects" to "Published Projects" for clarity

---

## 3. Alerts Dropdown - Add Border and Champagne UI

**Problem:** The alerts dropdown in the Chat Dashboard lacks borders and uses old red/amber styling that doesn't match the Champagne Gold standard.

**Fix in `AdminChatDashboard.tsx`:**
- Add `border-2 border-gold/30 rounded-xl` to alert cards
- Update the alert banner from `border-red-200 bg-red-50/80` to a champagne-compatible style with gold accent borders
- Style priority badges using the champagne palette (gold for critical, stone for medium)

---

## 4. Seller Listing - Add Sale/Rent Selection Step

**Problem:** The Seller Listing page (`/seller-listing`) only says "List Your Property for Sale" with no option to list for rent. Per the Listing Portal pattern, after choosing Manual vs AI, users should choose "List for Sale" or "List for Rent."

**Fix in `SellerListing.tsx`:**
- Add a pre-form selection screen with two cards (matching Listing Portal style):
  - "List for Sale" card (with DollarSign icon)
  - "List for Rent" card (with Home icon)
- Store the selection in form state as `listing_purpose: 'sale' | 'rent'`
- Update the page title dynamically: "List Your Property for Sale" or "List Your Property for Rent"
- Adjust form fields based on selection:
  - For rent: Show "Monthly Rent" instead of "Target Selling Price", add "Lease Duration" field
  - For sale: Keep existing fields
- Style these cards identically to the Listing Portal's two-card layout (white bg, gold borders, hover effects)

---

## 5. Listing Portal - Add Sale/Rent Sub-Selection After AI/Manual Choice

**Problem:** The Listing Portal shows Manual vs AI cards but doesn't ask if the user wants to list for sale or rent before proceeding.

**Fix in `ListingPortal.tsx`:**
- After the user clicks Manual or AI, show a second step with two cards:
  - "For Sale" 
  - "For Rent"
- Pass the selection as a URL parameter (e.g., `/seller-listing?purpose=sale` or `/listing-portal/submit?purpose=rent`)
- The downstream forms will read this parameter and configure accordingly

---

## 6. Enforce Champagne Gold UI on Remaining Pages

**Problem:** The `ListingPortalMyListings.tsx` page uses purple/fuchsia buttons (`from-fuchsia-600 to-purple-600`), violating the champagne standard.

**Fix:**
- Replace all `from-fuchsia-600 to-purple-600` with `bg-gold hover:bg-gold/90 text-black`
- Update any remaining dark backgrounds to champagne gradients
- Ensure the page matches the Listing Portal's champagne aesthetic

---

## Technical Summary

| File | Change |
|------|--------|
| `src/components/owner-dashboard/OwnerSidebarNav.tsx` | Move Founder into CREATIVE section next to Studio |
| `src/components/admin/AdminOverviewDashboard.tsx` | Fix project count query to filter `is_published = true` |
| `src/pages/admin/AdminChatDashboard.tsx` | Add champagne-styled borders to alerts dropdown |
| `src/pages/SellerListing.tsx` | Add sale/rent selection cards before the form |
| `src/pages/ListingPortal.tsx` | Add sale/rent sub-selection after Manual/AI choice |
| `src/pages/ListingPortalMyListings.tsx` | Replace purple/fuchsia buttons with champagne gold |
