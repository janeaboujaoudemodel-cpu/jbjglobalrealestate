## Goal

Build one isolated **Developers Portal** that replaces both `/developer-hub-admin` (owner) and `/developer-hub` (developer self-service), adds a **Sales Representatives** sub-system, and exposes a **broker access-request** flow for rep details. Public `/developers` listing stays as-is (untouched, SEO preserved).

---

## URL structure

```text
/developers-portal                       → new portal shell (auth required)
  /                                      → Overview (KPIs)
  /directory                             → All developers (Registered / Pending / Not Registered / Active / Inactive)
  /developers/:slug                      → Developer profile (full edit)
       ├─ overview / description / logo
       ├─ projects (previous / current / upcoming)
       ├─ media gallery
       ├─ brochures & documents
       ├─ contacts & social links
       └─ sales reps tab
  /reps                                  → All sales reps (filter by Emirate / language / developer / status)
  /reps/:id                              → Rep profile + availability calendar
  /reps/by-emirate                       → Grouped view + per-Emirate counts
  /projects                              → All projects across developers (approve / edit / status)
  /briefings                             → existing briefings hub
  /deals                                 → existing deals
  /calendar                              → portal-wide calendar
  /access-requests                       → broker → rep access requests (owner approval queue)
  /enrichment                            → site rebuild / scraping (kept)
  /missing-logos                         → kept
  /settings                              → portal-only settings (roles, permissions)

# Redirects (no broken links)
/developer-hub-admin/*  → /developers-portal/*   (preserve sub-path)
/developer-hub/*        → /developers-portal/*   (preserve sub-path; role gates the views)
/admin/developers*      → /developers-portal/directory
```

Public `/developers` and `/developer/:slug` remain unchanged.

---

## Roles & access model

Three portal roles enforced via `user_roles` + `has_role()`:

| Role              | Can see                                              | Can edit                                                                 |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `portal_owner`    | Everything                                           | Everything — override on any developer / rep / project                   |
| `portal_developer`| Their company + reps + assigned projects             | Own logo/description/media/brochures/projects/contacts                   |
| `portal_rep`      | Own profile, own calendar, projects assigned to them | Own profile, languages, photo, calendar, assigned projects (media/status)|

Brokers (existing `broker` role) get **no portal login** — they request access to a rep via a public page, owner approves.

---

## Sales Rep self-serve signup

1. Public page `/developers-portal/reps/apply` (linked from `/careers/developer-representative`).
2. Form writes to `developer_rep_applications` (status `pending`).
3. Owner sees them in `/developers-portal/access-requests` → **Approve** creates `auth.users`, grants `portal_rep` role, links to `developer_sales_reps` row, sends magic-link email via Resend (subject to existing Resend quota standard).
4. Rep logs in → lands on `/developers-portal/reps/me`.

---

## Broker access-request flow (replaces direct booking)

- Investors: see only the public `/developer/:slug` page — rep contact info stays hidden (per existing Contact Gating Standard).
- Brokers: on `/developer/:slug` see a **"Request access to sales rep"** button. Submits to `developer_rep_access_requests` (broker_id, developer_id, requested_rep_id nullable, reason).
- Owner approves in `/developers-portal/access-requests` → broker unlocks rep contact + availability; broker can then book a meeting from the rep card.
- Only `portal_owner` and approved `broker` can book a slot; investors never.

---

## Database changes (migration)

New tables:

- `developer_rep_applications` — self-serve signup queue (status, languages, nationality, position, emirates, requested_developer_id, applied_at).
- `developer_rep_access_requests` — broker→rep gated requests (broker_id, developer_id, rep_id, status, decided_by, decided_at, reason).
- `developer_rep_availability` — rep-owned slots (rep_id, starts_at, ends_at, is_blocked, recurrence_rule).
- `developer_rep_bookings` — confirmed meetings (rep_id, requester_id, requester_role `owner|broker`, starts_at, ends_at, status, source).
- `developer_portal_audit` — every owner override + role change.

Extend existing:

- `developer_sales_reps`: add `languages text[]`, `nationality`, `position`, `assigned_emirates text[]`, `availability_status` (`available|busy|off`), `auth_user_id uuid` link.
- `developers`: add `registration_status` enum (`registered|pending|not_registered|inactive`).

RLS: every table protected by `has_role(auth.uid(),'portal_owner')` OR ownership predicate (`rep.auth_user_id = auth.uid()` etc). No table without RLS.

Seed `app_role` enum with `portal_owner`, `portal_developer`, `portal_rep` if missing.

---

## Components & files

```text
src/routes/DevelopersPortalRoutes.tsx          (new — replaces DeveloperHubRoutes)
src/pages/developers-portal/
  PortalShell.tsx                              (single shell, role-aware sidebar)
  PortalOverview.tsx
  DeveloperDirectory.tsx                       (extends existing /developer-hub-admin/DeveloperDirectory)
  DeveloperProfileEditor.tsx                   (tabs: profile/projects/media/brochures/contacts/reps)
  reps/RepDirectory.tsx
  reps/RepByEmirate.tsx
  reps/RepProfileEditor.tsx                    (rep-owned editor + owner override)
  reps/RepAvailabilityCalendar.tsx
  reps/RepApplicationPublic.tsx                (public /reps/apply)
  access/AccessRequestQueue.tsx                (owner)
  access/BrokerRequestAccessButton.tsx         (used inside public /developer/:slug)
  projects/ProjectsTable.tsx                   (cross-developer)
src/components/developers-portal/
  PortalSidebarNav.tsx                         (role-filtered nav items)
  RegistrationStatusBadge.tsx
  RepAvailabilityBadge.tsx
src/hooks/
  usePortalRole.ts                             (returns 'owner'|'developer'|'rep'|null)
  useRepAvailability.ts
  useAccessRequests.ts
supabase/functions/
  portal-approve-rep-application/              (creates user, grants role, emails magic link)
  portal-decide-access-request/                (owner approve/deny → notify broker)
  portal-book-rep-slot/                        (owner+broker only, validates availability)
```

Existing files removed (legacy shells):
- `src/pages/developer-hub-admin/DeveloperHubAdminShell.tsx` → contents folded into `PortalShell.tsx`
- `src/pages/developer-hub/DeveloperHubShell.tsx` → same
- `src/routes/DeveloperHubRoutes.tsx` → replaced by `DevelopersPortalRoutes.tsx`
- All other `developer-hub*` page files are reused/moved under `developers-portal/` (no feature loss — per the No-Removal policy).

---

## Public-side touch-points (minimal)

- `/developer/:slug`: add `BrokerRequestAccessButton` (only visible to brokers). Reps section continues to hide contact details for everyone except approved brokers + owner.
- Footer / nav: replace links to `/developer-hub` with `/developers-portal`.

---

## Memory updates

After build, write new memory `mem://features/developer-portal/standalone-developers-portal-standard` covering:
- Single portal URL, role split, broker access-request flow, redirect map.
- Mark `mem://features/developer-portal/unified-portal-architecture` as superseded.

---

## Out of scope (call out)

- Investor-facing rep booking widget — explicitly **not** built (investors never book reps).
- Mobile app — portal is responsive web only, in line with existing shells.
- Public `/developers` redesign — untouched in this pass.

---

## Phasing

1. **DB migration + RLS + roles** (one supabase migration call).
2. **Portal shell + Overview + Directory** wired to existing data (no feature regression).
3. **Developer profile editor tabs** (logo / description / projects / media / brochures / contacts / social).
4. **Sales rep layer**: tables, public application page, owner approval edge function, rep self-serve editor + calendar.
5. **Broker access-request flow** + edge functions + public button.
6. **Redirects + nav rewrite + memory update + QA pass** (role matrix smoke test on owner / developer / rep / broker / investor).
