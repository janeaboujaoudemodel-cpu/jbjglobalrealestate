
# Comprehensive Listing Portal, Emergency Mirror, and Smart Listing Enhancements

## Overview
This plan covers: (A) Listing Portal filter layout fix, (B) Emergency Mirror panel UI fix to champagne theme, (C) Smart Listing Creator with AI Price Predictor, approval workflow, pricing/commission model, and role selection, (D) Notification bell fix.

---

## 1. Listing Portal - Filter Layout Fix

**Current state:** 5 filter buttons (All, For Sale, Yearly Rent, Short-term, Holiday Home) already appear on one row and look correct.

**Change:** Keep all 5 on one line but reorganize: Row 1 = All, For Sale, Yearly Rent (spread evenly). Row 2 = Short-term Rental, Holiday Home (centered, each taking half width).

**File:** `src/pages/ListingPortal.tsx`
- Split the `typeFilters` array into two rows
- Row 1: All, For Sale, Yearly Rent -- `flex justify-center gap-2`
- Row 2: Short-term, Holiday Home -- `flex justify-center gap-2` centered with `max-w-md mx-auto`

---

## 2. Emergency Mirror Panel - Champagne Theme Fix

**Current state:** Uses dark zinc-900/zinc-800 backgrounds, red-950 warning banners, purple-400 icons -- completely clashing with the champagne admin theme.

**File:** `src/components/listing-admin/EmergencyMirrorPanel.tsx`
- Replace `bg-red-950/40 border-red-500/40` warning banner with `bg-amber-50/80 border-2 border-gold/40` with gold text
- Replace `bg-zinc-900 border-zinc-700` cards with `bg-white border-2 border-gold/30` (champagne cards)
- Replace all `text-white` with `text-black`, `text-zinc-400` with `text-zinc-600`
- Replace `bg-zinc-800` stat boxes with `bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20`
- Replace `text-purple-400` icon color with `text-gold`
- Replace `bg-red-700` start button with `bg-gold hover:bg-gold/90 text-black`
- Remove emoji from the "Emergency Mirror" tab trigger in `ListingAdmin.tsx` (line 669) and style it with champagne active state

---

## 3. Smart Listing Creator - Full Workflow Enhancement

This is the largest section covering the AI listing flow, price predictor, approval workflow, pricing model, and role selection.

### 3A. AI Price Predictor Step

**New step** inserted between "AI Extraction" and "Review & Edit" in the listing submission flow.

**File:** `src/pages/ListingPortalSubmit.tsx` (or wherever the AI listing form lives)
- After AI extracts listing data, show a "Price Predictor" step
- Button calls the existing `property-evaluation` edge function with the extracted data
- Displays predicted price range, project completion status, and market insights
- Also attempts to pull completion data from the projects table (linked by project name matching)

### 3B. Listing Card Preview (like project cards)

After extraction + price prediction, generate a full **listing card preview** that looks identical to the project cards on the website:
- Thumbnail image, title, location, bedrooms, bathrooms, area sqft, price
- Clicking the card opens a **detailed page** showing all extracted info: description, amenities, floor plans, documents, inspection time, completion date, payment plan
- User can "Review & Edit" any field before submitting

### 3C. Role Selection

**Files:** `src/pages/SellerListing.tsx`, AI listing form
- Add a "Your Role" field in Step 1 (Seller Details) with options:
  - Property Owner
  - Broker
  - Investor
  - Representative (POA)
- Already partially exists as `seller_type` with values `owner`, `broker`, `poa` -- add `investor` and `representative`

### 3D. Multi-Stage Approval Workflow

**Database migration:** Create `listing_approvals` table:
```sql
CREATE TABLE listing_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL,
  listing_type TEXT NOT NULL, -- 'seller_listing' or 'portal_listing'
  step INTEGER NOT NULL,
  role TEXT NOT NULL,
  approver_name TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE listing_approvals ENABLE ROW LEVEL SECURITY;
```

**Approval chain** (reusing the existing `listing-approval-workflow.ts` config):
1. Admin (Sarah Mitchell) -- Step 1
2. Managing Director (David Thornton) -- Step 2
3. Executive Assistant (Amanda Clarke) -- Step 3
4. Founder (Jane Bou Jaoude) -- Step 4

**Owner bypass:** If the authenticated user is the Owner (`isOwner` from AuthContext), skip steps 1-3 and only show step 4 (self-approval). One click to approve and publish.

### 3E. Listing Pricing & Commission Model

Based on competitor research (Property Finder, Bayut, Dubizzle charge approximately AED 300-500 per listing), JBJ will charge half price.

**Two pricing options** shown after submission:
1. **Direct Contact** (AED 150-250): User's own phone/email shown on the listing. User pays upfront.
2. **Commission-Based** (Free to list): JBJ contact details shown. JBJ charges 1% commission on successful sale, 5% on rental.

**Implementation:** Add `contact_mode` field (`direct` | `commission`) and `listing_fee` to seller_listings and portal_listings tables. Show a pricing selection card after the Review step, before final submission.

### 3F. AI Photo Enhancement

When photos are insufficient, the system will:
- Search the `projects` table by matching project/building name to find existing gallery images
- Display found photos alongside uploaded ones for the user to select

---

## 4. Notification Bell - Overlap Fix

**File:** `src/components/ListingNotificationBell.tsx`
- Ensure the dropdown has `right-0` positioning (not overlapping the language/globe icon)
- Add `mt-2` gap between the bell and dropdown
- Verify z-index `z-[10001]` is working correctly

---

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/ListingPortal.tsx` | Split filter buttons into 2 centered rows |
| `src/components/listing-admin/EmergencyMirrorPanel.tsx` | Full champagne theme conversion |
| `src/pages/ListingAdmin.tsx` | Remove emoji from Emergency Mirror tab, champagne styling |
| `src/pages/SellerListing.tsx` | Add investor/representative roles, approval workflow UI |
| `src/pages/ListingPortalSubmit.tsx` | Add Price Predictor step, listing card preview, approval flow |
| `src/components/ListingNotificationBell.tsx` | Fix dropdown positioning |
| Database migration | `listing_approvals` table + `contact_mode`/`listing_fee` columns |
| `src/config/listing-approval-workflow.ts` | Already exists, will reuse for listing approvals |

---

## Execution Order

1. Emergency Mirror champagne fix (quick visual fix)
2. Filter layout fix (quick visual fix)
3. Notification bell positioning fix
4. Database migration for approval and pricing fields
5. Role selection additions
6. AI Price Predictor integration
7. Listing card preview generation
8. Multi-stage approval workflow UI
9. Pricing/commission selection step
10. Owner bypass logic
