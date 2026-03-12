

## Upgrade Plan: Investor Pages, Join Pages, CTA Sections, and Form Draft System

This is a large scope request. I recommend breaking it into **3 phases** to ensure quality and avoid errors. Here is the full plan for **Phase 1** (the most impactful changes), with Phase 2 and 3 outlined.

---

### Phase 1: Join Investor List Premium Upgrade + CTA Sections Edge-to-Edge + Form Draft/Reset Pattern

#### 1. `JoinInvestorList.tsx` — Full Premium UI Overhaul
- Replace the plain black page with a champagne-gold premium layout matching the investor dashboard aesthetic
- Add a proper hero header with gold gradient text, institutional typography
- Restructure the form into a 2-column champagne card layout with gold borders
- Reduce padding between sections (current `py-12`, `py-16` down to `py-6`, `py-8`)
- Add **Save Draft / Reset / New Application** action bar at top of form using the existing `SaveProjectBar` pattern:
  - "Save Draft" saves form state to localStorage (via `useFormAutoSave` pattern)
  - "Reset" clears the form
  - "New Application" clears draft and resets
- Fix color consistency: replace `text-zinc-400` with proper champagne foreground colors
- Make section borders sharp (not rounded) for edge-to-edge effect per user request

#### 2. `CombinedContactNewsletter.tsx` — Sharp Edges, Edge-to-Edge
- Change `rounded-xl sm:rounded-2xl` to `rounded-none` on the inner container for sharp borders
- This affects all "Ready to Get Started?" sections site-wide (used in MainLayout globally)

#### 3. `InvestorDashboard.tsx` — Fix Email Cropping + Need Assistance Layout
- Fix email display in profile/header area — ensure `break-all` or `truncate` with tooltip on email text
- Upgrade the "Need Assistance?" footer card (lines 799-829): make it edge-to-edge with sharp corners, better spacing, and gold accent
- Reduce spacing between all sections (`space-y-8` to `space-y-6`)

#### 4. `PortfolioViews.tsx` — Premium Border Upgrade
- Replace `border-2 border-gold/30` with a more premium `border border-gold/40` + subtle gold shadow
- Update the `PortfolioOverview` component cards similarly
- Change `rounded-2xl` on main container to `rounded-none` for sharp edge-to-edge look

---

### Phase 2 (Next Message): Join Broker List + Join Developer Page
- Create `JoinBrokerList.tsx` — similar premium form page for broker applications (budget fields replaced with experience, RERA license, specialization)
- Create `JoinDeveloperList.tsx` — developer partner registration page (company info, project portfolio, partnership type)
- Wire into routes and navigation

### Phase 3 (Following Message): Global Form Draft/Reset Pattern
- Add Save Draft / Reset / New Application bar to:
  - `SellerListing.tsx`
  - `LandlordListForm.tsx`
  - `ListingPortalSubmit.tsx`
  - `DealRegistrationForm.tsx`
- Standardize using a shared `FormDraftBar` component

---

### Files Modified in Phase 1

| File | Change |
|------|--------|
| `src/pages/JoinInvestorList.tsx` | Full premium redesign + draft/reset bar |
| `src/components/CombinedContactNewsletter.tsx` | Sharp edges (`rounded-none`) |
| `src/pages/InvestorDashboard.tsx` | Fix email cropping, upgrade Need Assistance section, reduce gaps |
| `src/pages/investor/PortfolioViews.tsx` | Premium borders, sharp edges |
| `src/components/investor/portfolio/PortfolioOverview.tsx` | Premium border upgrade on stat cards |

