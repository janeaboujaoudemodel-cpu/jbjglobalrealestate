

## Plan: Project Hub System

### Current State

The Listing Admin (`ListingAdmin.tsx`, 1451 lines) serves as the project management center with 4 views: Chat (generate listing), Projects (grid with filters/pagination), Data Ops (sync/enrichment tabs), and Editor (create/edit form). Clicking a project card opens `ProjectPreviewModal` — a lightweight dialog showing hero image, price, bedrooms, handover, and location with "View Listing" and "Edit" buttons. It does NOT show full project details like description, amenities, developer info, gallery, source data, or enrichment history.

### What Needs to Change

#### 1. Replace ProjectPreviewModal with Full Project Detail View (Task 5 — Priority Fix)

Replace the modal-only behavior with a new `ProjectDetailAdmin.tsx` component that renders inline (in the `editor` view area) when a project is clicked. This full detail view will show:

- **Header**: Project name, developer, status badges, source badge (Reelly/Provident), URL link
- **Gallery**: All images in a scrollable grid (not just hero)
- **Data fields**: Description, location, emirate, price range, bedrooms, handover, payment plan, service charge, amenities, floor plans, construction status, sale status
- **Developer info**: Name, linked developer page
- **Documents**: List of attached documents
- **Enrichment history**: Audit log entries from `admin_edit_log` + enrichment suggestions from `listing_enrichment_suggestions`
- **Actions**: Edit, Delete, View Public Listing, Hide Brochure toggle

The existing editor form will be accessible via an "Edit" button within this detail view.

#### 2. Add "Project Hub" as Primary Navigation Tab (Task 1)

Rename the "Projects" nav button to "Project Hub" and make it the default landing view. Add a toolbar row inside the hub with action buttons: Create Project, Generate Listing, Bulk Operations dropdown (publish/unpublish selected).

#### 3. Project Source & Enrichment Status in Grid Cards (Task 2)

Add to each project card in the grid:
- Source badge (Reelly API / Provident / Manual)
- Enrichment indicator (green dot = enriched, yellow = partial, red = needs data)
- Last update date
- Count of pending/missing fields

Query the `import_source` field from projects table and compute enrichment coverage inline.

#### 4. Project Status System (Task 4)

Add a status filter row with badges: Enriched, Pending, Needs Work, Approved, Published. Compute status from existing fields:
- **Published**: `is_published = true`
- **Enriched**: Has description + amenities + images + handover_date
- **Pending**: `status = 'pending'`
- **Needs Work**: Published but missing key fields (description empty OR no images)
- **Approved**: Has been through approval queue

Display status badge on each card. Do NOT mark a project as "Needs Work" if it has all essential fields populated.

#### 5. Enrichment History per Project (Task 3)

In the full project detail view, add an "Enrichment Log" tab that queries:
- `admin_edit_log` entries for this project (existing table)
- `listing_enrichment_suggestions` for this project (existing table — has before/after data)

Display as a timeline: field name, old value → new value, timestamp, source.

### Files Summary

| File | Change |
|------|--------|
| New: `src/components/listing-admin/ProjectDetailAdmin.tsx` | Full project detail view with all data fields, gallery, enrichment log, actions |
| `src/pages/ListingAdmin.tsx` | Rename "Projects" to "Project Hub", add status filters, add source/enrichment badges to cards, wire ProjectDetailAdmin as new view mode, add bulk operations |
| `src/components/listing-admin/ProjectPreviewModal.tsx` | Keep as optional quick-preview but add "Open Full Details" button |

### Implementation Order

1. Create `ProjectDetailAdmin.tsx` — full detail view with all project data, enrichment log, gallery, actions
2. Update `ListingAdmin.tsx` — rename to "Project Hub", add source badges + enrichment status to grid cards, add status filter row, wire detail view
3. Update `ProjectPreviewModal.tsx` — add "Open Full Details" action

