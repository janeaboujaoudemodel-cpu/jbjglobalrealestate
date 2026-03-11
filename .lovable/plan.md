

## Plan: Ticket Hub, Header Cleanup, Developer Mode & Auto-Listing System

### Scope Summary
This covers 8 distinct issues. Grouped by priority:

---

### 1. Fix "Create Ticket" Button → Open Ticket Creation (not list)

**Problem:** The sidebar "Create Ticket" link at line 1068-1074 of `GlobalVerticalNav.tsx` navigates to `/my-tickets` which shows the ticket list, not a creation form.

**Fix:**
- Create a new **Complaint Ticket Hub** page at `/ticket-hub` with two sections:
  - **Submit New Ticket** tab — form with subject, category, description, voice input, attachments
  - **Track My Tickets** tab — existing ticket list + inbox (reuse logic from `MyTickets.tsx`)
- Wire sidebar "Create Ticket" button to `/ticket-hub?tab=new`
- Register route in `PublicRoutes.tsx`

**Files:** Create `src/pages/TicketHub.tsx`, edit `GlobalVerticalNav.tsx` (line 1069), `PublicRoutes.tsx`

---

### 2. Remove Duplicated Horizontal Header

**Problem:** `GlobalHeader` shows on mobile (`<div className="lg:hidden">`) AND also `MyTickets.tsx` imports and renders its own `GlobalHeader` + `Footer` (lines 30-31), causing duplication on desktop too.

**Fix:**
- Remove `GlobalHeader` and `Footer` imports/usage from `MyTickets.tsx` — the page is inside `MainLayoutWrapper` which already provides them
- Audit other pages that import `GlobalHeader` directly (they shouldn't if inside `MainLayoutWrapper`)

**Files:** Edit `src/pages/client/MyTickets.tsx`

---

### 3. Fix Gold Color → Champagne Gold

**Problem:** Active ticket tabs use `bg-gold` (old yellow-gold). Must use champagne gold gradient.

**Fix:**
- In `MyTickets.tsx`, replace `data-[state=active]:bg-gold` with `data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8]`
- Apply same in new `TicketHub.tsx`
- Audit any `bg-gold` usage in ticket-related components and replace with champagne standard

**Files:** Edit `src/pages/client/MyTickets.tsx`, new `TicketHub.tsx`

---

### 4. Fix Slow CV Preview / HR Redirect

**Problem:** CV preview and HR Command Center redirect are slow due to synchronous edge function calls.

**Fix:**
- For CV preview: Add client-side loading states with immediate skeleton UI. If the preview loads from an edge function, show the cached/stored PDF URL directly instead of re-processing
- For HR redirect: Ensure navigation is instant (`navigate()`) without waiting for data pre-fetch — load data after mount
- Add `loading="lazy"` to CV iframe/embed elements

**Files:** Identify and edit HR-related components (will need to check exact files during implementation)

---

### 5. Highlight Unseen CVs

**Problem:** New CVs that haven't been viewed yet are not highlighted.

**Fix:**
- Add a `viewed_at` or `is_viewed` field tracking in the HR CV list
- Highlight unviewed CVs with a "NEW" badge and champagne-gold left border
- Mark as viewed when clicked

**Files:** HR components + possible migration for `is_viewed` column

---

### 6. Add "Developer" as Registration Category/Mode

**Problem:** Current modes are only: Investor, Broker, Visitor. Need to add "Developer" as a 4th category.

**Fix:**
- Expand `UserMode` type in `UserModeContext.tsx` to include `'developer'`
- Add Developer option to `ModeSelectionModal.tsx` with Building2 icon and description: "Submit projects, upload marketing materials, and manage launches"
- Update `normalizeMode()` to handle `'developer'`
- Update `user_preferences` to accept the new mode value
- Add Developer-specific flags: `isDeveloperMode` to context

**Files:** Edit `src/contexts/UserModeContext.tsx`, `src/components/ModeSelectionModal.tsx`, `src/hooks/useUserMode.ts`

---

### 7. Upgrade Developer Portal for Multi-Project Workflow

**Problem:** Current `DeveloperPortal.tsx` has basic forms. Needs a full session-based multi-project submission flow.

**Fix:**
- Redesign `DeveloperPortal.tsx` with:
  - **My Projects** tab — shows developer's submitted projects with status (pending/approved/live)
  - **Submit New Project** — session-based flow: enter project name → upload renders, PDFs, videos, descriptions, links → Submit → "Add Another Project" or "End Session"
  - **Events & Tasks** tab — submit events, request documents/signatures, create tasks for owner
  - **Check My Listings** — link to view their projects on the website with a "Report Issue" button
- Each project submission:
  - Saves all files to `documents/developer-uploads/{project_name}/`
  - Creates entry in `developer_launch_uploads`
  - Auto-generates a draft listing in `projects` table using the universal-link-extractor
  - Creates an alert/notification for the owner: "Developer X uploaded a new launch: Project Y"
- Add "Submit Documents for Your Project" CTA on homepage

**Files:** Rewrite `src/pages/DeveloperPortal.tsx`, edit `src/components/home/DeveloperPortalCTA.tsx`

---

### 8. Mode Hub (Owner-Only Analytics)

**Problem:** No dashboard showing registration stats by category.

**Fix:**
- Create `src/pages/ModeHub.tsx` — owner-only page at `/owner/mode-hub`
- Shows cards: "New Brokers (7d)", "New Investors (7d)", "New Developers (7d)", "New Visitors (7d)"
- Pulls from `user_preferences` table grouped by `selected_mode`
- Lists recent registrations with name, email, mode, date
- Add to `OwnerRoutes.tsx`

**Files:** Create `src/pages/ModeHub.tsx`, edit owner routes

---

### Database Changes

1. **Migration:** Add `'developer'` to the mode values accepted by `user_preferences.selected_mode`
2. **Migration:** Add `is_viewed boolean default false` to `hr_applications` (or equivalent CV table) for highlighting new CVs
3. **Migration:** Create `owner_alerts` table for developer upload notifications (or reuse `admin_tasks`)

---

### Files Summary

| File | Action |
|------|--------|
| `src/pages/TicketHub.tsx` | **Create** — Complaint Ticket Hub with submit + track tabs |
| `src/pages/ModeHub.tsx` | **Create** — Owner registration analytics |
| `src/pages/DeveloperPortal.tsx` | **Rewrite** — Multi-project session workflow |
| `src/pages/client/MyTickets.tsx` | **Edit** — Remove duplicate header/footer, fix gold colors |
| `src/components/navigation/GlobalVerticalNav.tsx` | **Edit** — Wire Create Ticket to `/ticket-hub?tab=new` |
| `src/contexts/UserModeContext.tsx` | **Edit** — Add 'developer' mode |
| `src/hooks/useUserMode.ts` | **Edit** — Add 'developer' mode |
| `src/components/ModeSelectionModal.tsx` | **Edit** — Add Developer option |
| `src/components/home/DeveloperPortalCTA.tsx` | **Edit** — Update CTA copy |
| `src/routes/PublicRoutes.tsx` | **Edit** — Add `/ticket-hub` route |
| `src/routes/OwnerRoutes.tsx` | **Edit** — Add `/owner/mode-hub` route |
| DB Migration | Add developer mode support, CV viewed tracking |

