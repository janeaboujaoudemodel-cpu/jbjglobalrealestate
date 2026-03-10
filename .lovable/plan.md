

## Plan: Navigation Highlights, Careers Polish, Quiz Free Access, Mobile Desktop Banner, Resale Filters, Legal Pages Full Restyle

This plan covers 8 areas across navigation, careers, quiz, mobile UX, resale, listing, and legal pages.

---

### 1. Vertical Nav — Color-Coded Highlighted Items

**File: `GlobalVerticalNav.tsx`**

Currently all highlighted items share the same gold styling. Add distinct colors:

| Item | Color |
|------|-------|
| AI Tools Hub | Orange (`bg-orange-500/15 text-orange-700 border-orange-400/30`) |
| List Your Property | Blue (`bg-blue-500/15 text-blue-700 border-blue-400/30`) |
| Resale Properties | Emerald (`bg-emerald-500/15 text-emerald-700 border-emerald-400/30`) |
| Careers & Join | Keep existing green |
| AI Home Finder | Keep existing purple |
| Create Ticket Support | Red thin border (`border-red-500/40 text-red-600`) |
| Contact Support | Red headset icon, red border (`text-red-500 border-red-500/30`) |

**Changes in `getItemStyle` and `getIconStyle`:**
- Add `item.href` checks for `/ai-hub`, `/listing-portal`, `/resale-properties`
- Each returns unique bg/text/border colors for active and inactive states
- Bottom support section: Change Headphones icon color to `text-red-500`, border to `border-red-500/30`, text stays readable
- Create Ticket: thinner red border (`border border-red-500/30`), text `text-red-600`

### 2. Careers Page — "Welcome Back" Screen Polish

**File: `JoinApplication.tsx` (lines 323-392)**

When `existingApplication` exists, upgrade the welcome back screen:
- Make full edge-to-edge: remove `bg-black` wrapper, use `jj-section-champagne min-h-screen`
- Remove the inner `max-w-2xl` constraint — let the card be `max-w-3xl` for more breathing room
- Add contact info below the card: `info@jbjglobal.com` and `+971 4 XXX XXXX` (or whatever company phone is used elsewhere)
- Add `Phone` and `Mail` icons from lucide
- Improve premium feel: add gold gradient border to the checkmark circle

### 3. AI Home Finder (Quiz) — Fully Free, No Credits/API

**Files: `Quiz.tsx`, `useQuizUsage.ts`**

The quiz already has `needsPayment = false` (line 405) and uses client-side project matching (no AI API calls). It queries the `projects` table locally and scores matches. No edge function is called.

**Verification:** The quiz does NOT call any AI gateway or edge function. It:
1. Fetches projects from the database
2. Runs local scoring algorithm
3. Saves results to `quiz_responses`
4. Navigates to results page

This is already free with no API key consumption. However:
- Remove the `PaymentModal` import and `showPayment` state (dead code)
- Remove `useQuizUsage` and `useMembership` imports since `needsPayment` is hardcoded to `false`
- Clean up unused payment-related code to make intent clear

### 4. Mobile "Best Experience on Desktop" Banner

**File: `MainLayout.tsx`**

Add a dismissible banner shown once per session on mobile devices:
- Show only when `isMobile` is true
- Store dismissal in `sessionStorage` (`jj_desktop_banner_dismissed`)
- Banner content: "For the best experience on our full portal, we recommend using a desktop browser." with a dismiss X button
- Style: champagne gradient strip at the top, gold border, small text
- Also trigger a toast notification via `sonner` on first mobile visit

### 5. Resale Properties — Match Project Page Filters

**File: `ResaleProperties.tsx`**

The resale page already has: Area, Type, Bedrooms, Handover, Price filters. The project page (`PropertiesReelly.tsx`) additionally has a `FilterShortcutBar` with map toggle, search, and more filter options.

Add to resale to match:
- Add `furnishing` filter (Furnished, Unfurnished, Semi-furnished)
- Add `developer` filter (from available resale listings)
- Add completion status filter if not already there
- Keep the sticky filter bar consistent with the project page champagne styling

### 6. Listing Portal — Match Project Page UI/Layout

**File: `ListingPortalSubmit.tsx`**

The listing submission form is a multi-step wizard. The user wants it styled like the project page listings. This means:
- Champagne gradient background (already partially done)
- Gold-bordered cards for each step
- Property card previews styled like project cards (image, title, price, location badge)
- Ensure the submitted listing preview matches the project card layout

### 7. Legal Pages — Full Restyle (ALL pages)

**10 legal pages need standardization.** Some have the new sidebar TOC layout (Terms, Privacy, Cookies, AmlKyc, Accessibility, RiskDisclosure, TrustAndCompliance) while others use accordion layout (Disclaimers, IntellectualProperty, TrustAndAuditCenter).

**Target layout for ALL legal pages:**
- Dark background hero with `py-28 md:py-36`, institutional badge pill, Playfair Display font
- 2-column layout: sticky sidebar TOC on desktop (w-64), mobile TOC card
- Active section highlighting in TOC (gold border-l-2)
- CCard champagne gradient cards for each section
- GoldDivider between major sections
- Footer with gold divider + copyright + links

**Pages that still use accordion/non-standard layout and need full restyle:**
- `Disclaimers.tsx` — Uses accordion `Section` component, no sidebar TOC, `max-w-4xl` instead of `max-w-6xl`
- `IntellectualProperty.tsx` — No sidebar TOC, uses `max-w-[1200px]`, different hero
- `TrustAndAuditCenter.tsx` — Uses accordion `Section` component, no sidebar TOC, `max-w-4xl`

**Pages that have sidebar TOC but may need minor polish:**
- `Terms.tsx`, `Privacy.tsx` — Already good, verify consistency
- `Cookies.tsx`, `AmlKycPolicy.tsx`, `Accessibility.tsx`, `RiskDisclosure.tsx`, `TrustAndCompliance.tsx` — Already have sidebar TOC, verify active section highlighting and layout consistency

**Standardization for accordion pages (Disclaimers, IP, Trust&Audit):**
- Convert from accordion sections to flat CCard sections with sidebar TOC
- Add `tocItems` array and `IntersectionObserver` for active tracking
- Add `scrollTo` function
- Restructure to 2-column flex layout with aside + main

### 8. Mobile Header — Mirror Updates

**File: `GlobalHeader.tsx`**

Apply the same color-coding to mobile menu items:
- AI Tools Hub → orange
- List Your Property → blue
- Resale Properties → emerald
- Contact/Ticket support → red accents

---

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Color-coded nav items + red support buttons |
| `src/components/GlobalHeader.tsx` | Mirror color-coded items on mobile |
| `src/pages/JoinApplication.tsx` | Welcome back screen polish + contact info |
| `src/pages/Quiz.tsx` | Remove dead payment code |
| `src/components/MainLayout.tsx` | Mobile desktop recommendation banner |
| `src/pages/ResaleProperties.tsx` | Add furnishing + developer filters |
| `src/pages/Disclaimers.tsx` | Full restyle with sidebar TOC |
| `src/pages/IntellectualProperty.tsx` | Full restyle with sidebar TOC |
| `src/pages/TrustAndAuditCenter.tsx` | Full restyle with sidebar TOC |
| `src/pages/ListingPortalSubmit.tsx` | Match project page card styling |

