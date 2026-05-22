## Move Developer Hub out of Listings → Admin Developer Portal

Right now `/admin/developers` lives inside the Listings area and only shows an overview/projects table. You want it to become the **single source of truth for every developer**, with full CRUD over their identity, content, media, projects, and registered sales reps — and to give each sales rep the same editing surface (gated to their developer).

---

### 1. Navigation / Placement

- Remove "Developers" from the Listings admin nav.
- Add a top-level **Developer Portal** entry in the Owner sidebar (under CORE, after Owner Panel/Overview).
  - Owner sees: all developers + all registered sales reps + roles + analytics.
  - Sales rep sees: only the developer they are registered under (same edit UI).
- Existing `/admin/developers` route stays, but the page is rebuilt as the new portal hub.

---

### 2. Developer Hub list page (`/admin/developers`)

Replace the current "DeveloperOverviewTab" with a real directory:

- Searchable, filterable table of all developers.
- Columns: Logo · Developer · # Projects · # Sales reps · Last updated · Status (Confirmed / Needs review) · Actions.
- Row click → `/admin/developers/:slug` (full profile).
- "+ Add Developer" button (owner only).
- Secondary tab: **Sales Representatives** — list of every registered rep across all developers (name, languages, developer, role, last activity, contact).

---

### 3. Developer profile page (`/admin/developers/:slug`)

Full editable profile, single page with sub-tabs:

1. **Overview** — logo (placeholder if missing, click to upload), legal name, trading name, founded, HQ, website, description (rich text), languages, social links.
   - "Description must match the developer's official website" notice.
   - **Confirmation block** at the bottom: checkbox "I confirm this information matches the developer's official website" + signature line (user name + timestamp). Stored as a confirmation record; shows "Last confirmed by X on …".
2. **Projects** — every project by this developer, clickable → project edit page. Inline edit of name, status, handover, units. "+ Add Project".
3. **Media** — drag-drop uploader for photos, videos, brochures, floor plans, maps, any files. Reordering, captions, type tagging. No size category limits beyond storage policy.
4. **Contacts** — developer's own contact details (HQ phone, email, address, map pin) + list of sales representatives registered under this developer with their full profile (photo, languages, role, phone, email, WhatsApp, bio). Owner can invite/suspend reps from here.
5. **Files & Brochures** — same uploader scoped to documents (PDF/DOC/XLS).
6. **Activity** — audit log of every edit (who, what, when, before/after).

All edits autosave + show "Saved · pending confirmation" until the Overview confirmation checkbox is re-signed.

---

### 4. Sales Representative editing surface

- Reps registered under a developer get the **same edit UI** for that developer only.
- Route: same `/admin/developers/:slug` — guard checks `is_owner OR rep.developer_id = developer.id`.
- Every save by a rep flags the developer as "Pending owner review" until the owner re-confirms (or rep re-confirms with the "matches official website" checkbox).

---

### 5. Data model (Supabase)

New / extended tables:

- `developer_profiles` — extend existing developers table with: `description_rich`, `languages text[]`, `hq_address`, `hq_map`, `social_links jsonb`, `last_confirmed_by`, `last_confirmed_at`, `confirmation_source` (owner/rep).
- `developer_media` — `developer_id, kind (photo|video|brochure|file|map), url, caption, display_order, uploaded_by`.
- `developer_sales_reps` — `developer_id, user_id, role, phone, whatsapp, languages text[], bio, photo_url, status (active|suspended|pending)`.
- `developer_audit_log` — `developer_id, actor_id, action, diff jsonb, created_at`.
- Storage bucket `developer-assets` (public read, owner+rep write via RLS).

RLS:
- Owner: full access.
- Rep: read/write only rows where `developer_id` matches their `developer_sales_reps.developer_id` and `status = 'active'`.
- Public: read only published, non-sensitive fields (no contacts) — respects existing Contact Gating Standard.

---

### 6. Out of scope for this pass

- Sales-rep self-registration flow (already exists in Developer Portal registration standard — we only consume it here).
- Auto-logo scraping (already shipped via `auto-find-developer-logos`).
- Public-facing developer pages (untouched; this is admin-side only).

---

### Files to create / edit (high level)

- New: `src/pages/admin/developers/DeveloperPortalHub.tsx`, `DeveloperProfilePage.tsx`, tabs (`OverviewTab`, `ProjectsTab`, `MediaTab`, `ContactsTab`, `FilesTab`, `ActivityTab`), `DeveloperConfirmationBlock.tsx`, `SalesRepsDirectory.tsx`.
- Edit: `src/pages/AdminDevelopers.tsx` (becomes a thin router into the hub), `src/components/owner-dashboard/OwnerSidebarNav.tsx` (add Developer Portal entry), routes.
- Remove from Listings nav: the "Developers" link.
- Migration: tables, RLS, storage bucket, triggers for audit log + auto-clear confirmation on edit.
- Guard: `useDeveloperEditAccess(developerId)` hook.

Approve and I'll build it.