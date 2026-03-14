

# Combined Fix: Listing Admin + Unified Inbox

This plan addresses all reported issues in a single release across two systems.

---

## Part A: Listing Admin Fixes

### A1. Approval Center — Citi Developer visibility & filtering

**Problem**: 118 pending items shown but no way to find Citi Developer projects. No search, no developer filter within the Approval Center.

**Fix in `ProjectApprovalQueue.tsx`**:
- Add a **search bar** to filter pending imports by name/developer
- Add a **developer name filter** dropdown populated from distinct `developer_name` values in the queue
- The 5 Citi Developer projects (ARYA, AGUA, AVELINE, AMRA, Allura) are confirmed in the database with `status: pending` — they will surface immediately with the search

### A2. Enrichment Center — Missing Data click-through & checklist

**Problem**: Published Projects (2,778), Missing Data (2,657), Complete stats are shown but clicking them does nothing. No indication of what fields are missing.

**Fix in `EnrichmentCenter.tsx` (ProvidentEnrichmentPanel)**:
- Make the stats cards **clickable** — clicking "Missing Data" navigates to `/listing-admin?view=projects` with a `statusFilter=needs-work` pre-applied
- Clicking "Complete" navigates with `statusFilter=enriched`
- Add a **completeness checklist** definition visible in the UI: Description (50+ chars), Images (3+), Amenities, Handover Date, Developer Name, Floor Plans
- Show which fields are missing per project in the Project Hub grid cards as small red/green dots

### A3. Broken first image in galleries

**Problem**: First image always shows as broken frame, subsequent images load fine.

**Fix in `SafeImage.tsx`**:
- Remove `loading="lazy"` for images with `display_order === 0` or when explicitly marked as primary/hero
- Add `fetchpriority="high"` for first gallery images
- In `PendingImportCard.tsx`, pass `loading="eager"` for the currently displayed image (index 0)

### A4. Layout/floor plan images mixed into gallery

**Problem**: Floor plans appearing in the main photo gallery instead of the layout section.

**Fix in `PendingImportCard.tsx` and `ProjectApprovalQueue.tsx`**:
- Add image classification filter: exclude URLs containing `floor-plan`, `layout`, `master-plan`, `unit-type`, `factsheet`, `payment-plan` from the main gallery display
- Show these separately in a "Documents & Plans" section below the gallery

### A5. Duplicate project detection & cleanup

**Problem**: Vida Residences and others are duplicated. The Citi projects have both `pending` and `approved` versions.

**Fix**:
- In `ProjectApprovalQueue.tsx`, enhance `checkForDuplicates` to also check within `pending_project_imports` itself (not just `projects` table)
- Add a **dedup badge** on cards that have duplicate entries
- For existing duplicates (Citi approved + pending), create a database migration to clean the approved duplicates that shouldn't have been auto-approved

### A6. Auto-publish complete projects

**Problem**: Projects like Albero, Boulevard Heights have full data but `is_published: false`.

**Fix**:
- Add an "Auto-Publish Complete" button in the Project Hub that:
  1. Queries all projects where `is_published = false` AND has description, images (3+), developer, handover date, price
  2. Shows a confirmation dialog with the count
  3. Bulk-updates `is_published = true` for qualifying projects
- Wire this into the existing `ProjectApprovalQueue` approve flow: when approving, if all core fields are present, auto-set `is_published = true` (already done, but ensure the completeness check is robust)

### A7. Validate 2,778 projects are genuine

- Add a "Data Integrity Check" button to the Provident Portal Hub that runs a query counting:
  - Projects with no images AND no description → flag as "ghost entries"
  - Projects with duplicate slugs → flag as "duplicates"
  - Display results with option to bulk-delete ghost entries

---

## Part B: Unified Inbox Fixes

### B1. Replace channel dropdown with header tabs + badges

**Problem**: Channel selection uses a dropdown `<Select>`. User wants header tabs with unread count badges.

**Fix in `OwnerInbox.tsx`**:
- Replace the channel `<Select>` with a horizontal tab bar using `<button>` elements styled as tabs
- Each tab shows: channel icon + label + unread count badge (e.g., "WhatsApp (3)")
- Tabs: All, WhatsApp, Gmail, Hostinger, Instagram, Facebook, Website, Voice
- Active tab gets `border-b-2 border-gold font-bold` styling
- Clicking a tab sets `filters.channel` and reloads threads within the same screen (no navigation)

### B2. Stats cards — active state with 3D highlighting

**Problem**: Stats cards (Total Unread, Needs Reply, New, Follow-up Due) only show hover effect but don't stay highlighted when clicked.

**Fix in `OwnerInbox.tsx` (StatsCard component)**:
- Add `activeFilter` state tracking which stat card is active
- Clicking a stat card sets it as active AND filters the thread list accordingly:
  - "Unread" → `filters.unreadOnly = true`
  - "Needs Reply" → `filters.status = 'needs_reply'`
  - "New" → `filters.status = 'new'`
  - "Follow-up Due" → `filters.status = 'follow_up_due'`
- Active card styling: stronger border color, 3D box-shadow (`shadow-lg`), scale transform (`scale-[1.02]`), persistent background tint matching the variant color
- "Needs Reply" active state: `border-red-500 bg-red-100 shadow-[0_4px_12px_rgba(239,68,68,0.3)]`

### B3. Communication Settings — back button & performance

**Problem**: No back button on `/owner/settings/communication`. Page loads slowly.

**Fix in `OwnerCommSettings.tsx`**:
- Add a back button (`<ArrowLeft>`) in the header that calls `navigate(-1)`
- Wrap channel list query in React Query with `staleTime: 60000` to prevent refetching on every render

### B4. Wire missing messages

**Problem**: Messages from some channels not showing.

**Fix in `useOwnerInbox.ts`**:
- Audit the thread query to ensure it fetches ALL channels (not filtered by `is_active` only)
- Remove any `channel_type` restrictions in the default query so all historical threads appear
- Add a "Last Sync" timestamp display per channel in the inbox header

---

## Implementation Order

1. **A1** — Approval Center search/filter (makes Citi visible immediately)
2. **B1 + B2** — Inbox tabs + active stat cards (highest visual impact)
3. **A3 + A4** — Image fixes (broken frames + layout separation)
4. **A2** — Enrichment clickable stats + checklist
5. **B3** — Comm settings back button
6. **A5 + A6 + A7** — Dedup, auto-publish, integrity check
7. **B4** — Message wiring audit

---

## Technical Notes

- All Citi Developer data is confirmed in the database: 5 projects in `pending_project_imports` with `status: pending`, 1 developer in `pending_developer_imports` with `status: pending`
- There are also 5 `approved` duplicates that need cleanup
- The `pending_project_imports` table has 1,937 total rows (118 pending)
- The enrichment stats show 2,778 published projects — the "Missing Data" count (2,657) is based on checking `amenities`, `payment_plan`, `payment_breakdown`, `faqs`, `location_distances` — these are optional enrichment fields, not core fields
- No database schema changes needed — all fixes are frontend UI/logic changes plus one cleanup migration for duplicate approved entries

