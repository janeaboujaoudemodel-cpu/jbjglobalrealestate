

## Plan: Navigation Fixes, Edge-to-Edge Global Audit, Quiz Centering, Featured Cards, Favorites Alignment, and Shortcut Icons

This plan addresses all issues raised: nav label, logo redirect speed, edge-to-edge globally, quiz centering/results, featured card descriptions, favorites alignment, shortcuts overflow, icon diversity, color softening, and section screen sync.

---

### 1. Rename "Careers & Join" → "Careers" in Vertical Nav + Mobile Header

**Files:** `GlobalVerticalNav.tsx` (line 59), `GlobalHeader.tsx`
- Change `label: "Careers & Join"` → `label: "Careers"` in NAV_ITEMS
- Change color from emerald (same as Resale) to a distinct color — **teal** (`bg-teal-500/10 text-teal-700 border-teal-400/25`)
- Update `getItemStyle` and `getIconStyle` for `/join` to use teal instead of emerald
- Update mega menu company links (line 193) from `'Careers & Join'` → `'Careers'`
- Mirror in `GlobalHeader.tsx` mobile menu

### 2. Soften All Hub Highlight Colors

Current colors are too saturated. Reduce opacity/intensity:
- **AI Tools Hub:** `bg-orange-500/10` (from /15), `text-orange-600` (from /700), `border-orange-300/25`
- **List Your Property:** `bg-blue-500/10`, `text-blue-600`, `border-blue-300/25`
- **Resale Properties:** `bg-emerald-500/10`, `text-emerald-600`, `border-emerald-300/25`
- **AI Home Finder:** `bg-purple-500/10`, `text-purple-600`, `border-purple-400/25`
- **Careers:** `bg-teal-500/10`, `text-teal-700`, `border-teal-300/25`
- **Support/Ticket:** `border-red-400/25` (from /30), `text-red-500` (from /600)

### 3. Logo Click — Faster Home Redirect

The `<Link to="/">` on the logo (lines 871-874) uses React Router which should be instant. The delay is likely caused by the homepage lazy-loading a heavy chunk. 

**Fix:** Add `prefetchHomepage` on hover:
```tsx
const prefetchHome = () => { import("@/pages/Index"); };
<Link to="/" onMouseEnter={prefetchHome} onClick={() => setActiveMegaMenu(null)}>
```

### 4. Edge-to-Edge Layout — GLOBAL Audit & Fix

Current pages still using `mx-3 md:mx-4 lg:mx-6` with borders:
- `About.tsx` (7 instances)
- `Contact.tsx` (6 instances) 
- `MyDashboardActivity.tsx` (1 instance)

**Fix all:** Replace `mx-3 md:mx-4 lg:mx-6` → `mx-0` globally in these files. Keep the champagne gradient cards but remove the margin so they stretch edge-to-edge.

### 5. Handpicked For You — Add Description to Cards

**File:** `FeaturedListings.tsx` (line 232-233)
- The ProjectCard has a comment `{/* Description - 2 lines with ...more */}` but no content
- Add project description (need to fetch `description` from DB query, line 41)
- Add to query: include `description` field
- Render: `<p className="text-stone-500 text-xs line-clamp-2 mb-2">{project.description}</p>`
- Add a gold divider (`<hr className="border-gold/20 my-2">`) between the developer name and the handover/payment row

### 6. Favorites Page — Uniform Card Sizing

**File:** `Favorites.tsx` (lines 260, 328)
- Grid currently uses `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` for favorites
- Add fixed aspect ratio wrapper: wrap each card in `<div className="h-full">` and ensure `ProjectCard` has `h-full` on its root element
- For shortlist: change `lg:grid-cols-3` to `lg:grid-cols-4` for consistency
- This ensures all cards are the same height regardless of content

### 7. Section Click → Open Corresponding Screen

**File:** `GlobalVerticalNav.tsx` (line 562-573)
- Currently `toggleSection` opens the section AND the first mega menu flyout
- User wants: clicking a section header should also NAVIGATE to the first item's route
- Change: When opening a section, also call `navigate(firstItem.href)` so the main content area updates
- Import `useNavigate` and add navigation on section toggle

### 8. My Shortcuts — Fix Overflow, 3-Column Grid

**File:** `GlobalVerticalNav.tsx` (lines 652-714)
- The shortcuts mega menu uses `max-h-[85vh]` with a scrollable container
- Items below "Owner Command Center" get cut off
- **Fix:** Change items layout from vertical stack to a responsive 2-3 column grid inside each group
- Change `space-y-0.5` → `grid grid-cols-2 gap-1` for each group's items
- Increase panel width: `w-[min(560px,calc(100vw-240px))]` (from 440px)
- Add `overflow-y-auto` with proper `max-h` calculation

### 9. Diversify Shortcut Icons

**File:** `GlobalVerticalNav.tsx` (lines 300-372)
- Duplicated icons: `ListChecks` used for "My Tasks" and "Shortlisted"; `Bell` for "Notifications" and "Alerts"; `Heart` for "Favorites" (appears twice); `Headphones` for "Customer Happiness" and "Support Tickets"; `Shield` for "Owner Command Center" and "Admin Panel"
- **Fix:**
  - Shortlisted → `Star`
  - Alerts → `Zap`
  - Favorites (Account group) → remove duplicate, keep only in My Tasks group
  - Customer Happiness → `Users` (was `Headphones`)
  - Admin Panel → `Lock` or `Settings`
  - CP Center → `Compass` (already has it, just ensure it's distinct)
  - Support Tickets → `Ticket` (from lucide)

### 10. Quiz — Center Options & Fix Results

**File:** `Quiz.tsx`
- Line 750: The flex layout uses `items-start` which pushes content to the top-left when the sidebar is present
- Change `items-start` → `items-center` for vertical centering
- Line 751: `max-w-4xl flex gap-8` — the sidebar takes space from the quiz area
- Change to center the main question area: wrap in `mx-auto` and ensure the question grid is centered

**Results not showing:** Line 429 sends `recommendations.slice(0, 5)` slugs. If `getRecommendations()` returns empty (no projects match), no results show.
- Add fallback: if fewer than 3 matches, relax filters (remove area filter, widen budget) and retry
- Show top 3 results (change `slice(0, 5)` → `slice(0, 3)`)

**Lead capture gate before results:** 
- The form screen already captures leads (lines 566-718)
- The flow is: Quiz → Form → Results. User wants: Quiz → Form (with lead capture via `useLeadCapture`) → Results
- Integrate `useLeadCapture.captureLead()` in `handleSubmitForm` before navigating to results
- If user already has lead data in localStorage, skip the form and go straight to results

### 11. AI Hub Screen — Fix Cropped Layout

The AI Hub page content gets cut off on the right or bottom when the vertical nav is present.
- Check the main content container in `AIHub.tsx` and ensure it respects the sidebar offset
- Add `overflow-x-hidden` to prevent horizontal crop
- Ensure the tool cards grid doesn't exceed the viewport width minus sidebar

### 12. MY ACCOUNT Section — Visual Differentiation

User wants MY ACCOUNT to look special/different from other sections.
- Add a distinct header style: use a champagne gradient background for the MY ACCOUNT section header
- Add a gold top border divider before MY ACCOUNT section
- Make the section header larger: `text-[12px]` instead of `text-[11px]`

---

### Files to Edit

| File | Changes |
|------|---------|
| `src/components/navigation/GlobalVerticalNav.tsx` | Rename Careers, soften colors, logo prefetch, section→navigate, shortcuts grid+icons, MY ACCOUNT special styling |
| `src/components/GlobalHeader.tsx` | Rename Careers in mobile, soften colors |
| `src/components/home/FeaturedListings.tsx` | Add description to cards, add dividers, fetch description field |
| `src/pages/Favorites.tsx` | Uniform card grid sizing |
| `src/pages/Quiz.tsx` | Center quiz options, fix empty results fallback, integrate lead capture gate |
| `src/pages/About.tsx` | Edge-to-edge: `mx-3 md:mx-4 lg:mx-6` → `mx-0` |
| `src/pages/Contact.tsx` | Edge-to-edge: `mx-3 md:mx-4 lg:mx-6` → `mx-0` |
| `src/pages/MyDashboardActivity.tsx` | Edge-to-edge: `mx-3 md:mx-4 lg:mx-6` → `mx-0` |
| `src/pages/AIHub.tsx` | Fix layout overflow/cropping with sidebar |

