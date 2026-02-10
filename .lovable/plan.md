
# Owner Command Center -- Full Audit and Fix Plan

This is a comprehensive overhaul of the Owner Command Center covering layout, navigation, performance, and UI consistency across all sections and sub-pages.

---

## Problems Identified

### 1. Navigation Breaks the Shell
When clicking sidebar links like Marketing Hub (`/admin/marketing-hub`), CRM (`/crm`), Calendar (`/crm/calendar`), Studio (`/studio`), etc., the user is navigated **outside** the Owner Dashboard Shell. The sidebar disappears, and clicking "Back" doesn't return to `/owner`. These routes are defined under `MainLayoutWrapper` in App.tsx, not nested under the `/owner` shell.

### 2. Newest Leads Display -- Vertical Instead of Horizontal Cards
The "Newest Leads" section in the Overview tab renders leads as full-width stacked rows (vertical list). The user wants them displayed as horizontal/rectangular cards (side-by-side in a grid).

### 3. Follow-Up Items Missing Context
The "Needs Follow-up" section shows items without indicating what lead they relate to (just task titles or names without source context like "Lead from Website" or "Follow-up for property inquiry").

### 4. Deal Prediction Card -- Light Theme on Dark Background
`DealPrediction.tsx` uses a champagne/cream gradient (`from-[#FDFBF7]`) which clashes with the dark Owner Command Center theme. Text colors like `text-zinc-600`, `text-zinc-700`, `text-black` look broken on the dark background context.

### 5. Contact Info Card -- Content Overflowing
In `CRMLeadDetail.tsx`, the Contact Info card's action buttons (WhatsApp, Call, Email) are in a flex row that doesn't wrap on smaller screens, causing overflow. The `flex items-center justify-between` layout breaks when the card is in a narrow column.

### 6. CRM Lead Detail Page Not Inside Shell
The `/crm/leads/:id` route renders outside the Owner Shell, so the sidebar is gone. The "Back" button navigates to `/crm` (also outside the shell), not back to `/owner`.

### 7. Marketing Hub Cropped at Top
The Marketing Hub page renders under `MainLayoutWrapper` which has its own header/footer. When accessed from the Owner sidebar, the user expects it inside the shell. The shell header + the page's own header create a double-header / cropped view.

### 8. Slow Loading Between Sections
Multiple independent queries fire on the Overview page (6+ parallel Supabase queries). Sub-pages also re-render the full layout. No query prefetching or caching optimization is in place beyond default React Query settings.

---

## Implementation Plan

### Phase 1: Fix Navigation Architecture (Most Critical)

**File: `src/pages/OwnerDashboardShell.tsx`**
- Modify the sidebar navigation behavior: instead of using `navigate()` for external routes (those outside `/owner/*`), open them in an **embedded iframe or inline panel** within the shell's `<Outlet />` area
- Alternative (simpler): For routes that can't be nested, keep the sidebar visible by wrapping those pages in the shell layout via route nesting

**File: `src/App.tsx`**
- Move key admin routes under the `/owner` shell as nested routes:
  - `/owner/crm` renders CRM content
  - `/owner/marketing-hub` renders Marketing Hub
  - `/owner/crm/calendar` renders Calendar
  - `/owner/crm/tasks` renders Tasks
  - `/owner/analytics` renders Analytics
  - `/owner/studio` renders Studio
  - etc.
- Create wrapper components that render each page's content without their own layout chrome

**File: `src/components/owner-dashboard/OwnerSidebarNav.tsx`**
- Update all `path` values in `NAV_SECTIONS` to use `/owner/...` prefixed routes
- This ensures clicking any sidebar item stays within the shell

### Phase 2: Fix Newest Leads Layout

**File: `src/pages/OwnerDashboardOverview.tsx`**
- Change the Newest Leads section from a vertical stack to a horizontal grid: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
- Redesign `LeadRow` into a compact rectangular card showing: avatar, name, source badge, time ago, and a small action button
- Each card is a clickable rectangle instead of a full-width row

### Phase 3: Fix Follow-Up Context

**File: `src/pages/OwnerDashboardOverview.tsx`**
- In the `followUpItems` query, when fetching tasks, also join/fetch the related lead name via `lead_id`
- In `FollowUpItem`, display the lead source or related lead name below the task title (e.g., "Follow-up call -- Lead: Ahmed K.")
- For lead-type follow-ups, show the pipeline stage and source

### Phase 4: Fix Deal Prediction Dark Theme

**File: `src/components/crm/DealPrediction.tsx`**
- Replace all light-theme colors with dark-theme equivalents:
  - Card: `bg-zinc-900/80 border-zinc-800` (matching owner dashboard cards)
  - Inner sections: `bg-zinc-800/50 border-zinc-700`
  - Text: `text-white`, `text-zinc-400`, `text-gold` instead of `text-black`, `text-zinc-600`
  - Risk badges: dark-themed variants (`bg-emerald-500/20 text-emerald-400`)
  - Probability color: gold-themed
  - Stage progress bar: gold on `bg-zinc-700`

### Phase 5: Fix Contact Info Card Layout

**File: `src/pages/CRMLeadDetail.tsx`**
- Make the contact action buttons wrap on small screens: change the phone/WhatsApp/Call/Email button containers to `flex flex-wrap gap-2`
- Ensure the contact info section uses `break-all` or `truncate` for long email addresses
- Add `overflow-hidden` to the card container to prevent content bleeding

### Phase 6: Performance Improvements

**File: `src/pages/OwnerDashboardOverview.tsx`**
- Add `staleTime: 5 * 60 * 1000` (5 minutes) to all dashboard queries to prevent refetching on every tab switch
- Add `refetchOnWindowFocus: false` to prevent unnecessary refetches
- Wrap tab content in `React.memo` or use conditional rendering to avoid re-mounting heavy components

### Phase 7: Premium UI Polish

**File: `src/pages/CRMLeadDetail.tsx`**
- When accessed from the Owner context, apply dark theme styling consistently
- Update the header "Back" button to navigate to `/owner` instead of `/crm`

**File: Multiple components**
- Ensure all cards within the owner context use `bg-zinc-900/80 border-zinc-800` consistently
- Ensure text contrast follows WCAG AA on dark backgrounds

---

## Technical Details

### Route Nesting Strategy
The safest approach is to create lightweight wrapper pages under `/owner/*` that import and render the existing page components without their standalone layout chrome. For example:

```text
/owner/marketing-hub --> renders <MarketingHubContent /> (without MainLayout)
/owner/crm/leads/:id --> renders <CRMLeadDetailContent /> (without standalone header)
/owner/studio --> renders <StudioContent />
```

This avoids duplicating page logic while keeping everything inside the shell.

### Files to Modify (Summary)

| File | Changes |
|------|---------|
| `src/App.tsx` | Add nested routes under `/owner` for CRM, Marketing Hub, Studio, Analytics, etc. |
| `src/components/owner-dashboard/OwnerSidebarNav.tsx` | Update all paths to `/owner/...` prefixes |
| `src/pages/OwnerDashboardOverview.tsx` | Grid layout for leads, query caching, follow-up context |
| `src/components/crm/DealPrediction.tsx` | Dark theme conversion |
| `src/pages/CRMLeadDetail.tsx` | Contact card overflow fix, dark theme, back navigation |
| `src/pages/OwnerDashboardShell.tsx` | Minor adjustments for nested route support |
| New wrapper files (5-8 files) | Thin wrappers for pages rendered inside the shell |

### Estimated Scope
This is a large change touching 10-15 files. It is recommended to implement in phases, starting with Phase 1 (navigation fix) as it resolves the most critical UX issues (broken back button, lost sidebar, cropped pages).
