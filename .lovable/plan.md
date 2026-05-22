
# Developer Partnership Panel + Scoped Sales-Rep Access

You're right — today's panel toggles a flag on every developer with no application behind it. We'll rebuild it as a proper application workflow + scoped representative system.

## 1. Concepts (what changes mentally)

- A developer in the directory is just a brand card. It should NOT show "pending / approve" on its own.
- A **Developer Application** is what a sales rep submits to claim the right to represent a developer. Only applications get "Approve / Reject".
- A **Developer Representative** is a user the owner authorizes to manage ONE developer's content. They can be:
  - created automatically when an application is approved, OR
  - added manually by the owner.
- A representative gets exactly two things: normal public-site access (as any user), plus the Developer Portal scoped to their assigned developer only. No CRM, no leads, no other developers, no owner backend.

## 2. New panel: `/owner/developer-partnerships`

Rename `DeveloperTrustPanel` → `DeveloperPartnershipPanel`. Three tabs:

**Tab A — Applications**
List of `developer_applications` rows (status = pending). Each card shows: applicant name/email, requested developer (with logo), uploaded brochures, description, Google Drive link, list of past/current/upcoming projects they entered, attached company docs. Actions: **Approve & Authorize**, **Request changes**, **Reject**. Approve opens a confirm dialog: "Authorize {user} to represent {developer}?" — on confirm: creates `developer_representatives` row, sets `developers.has_active_rep = true`, sends the rep a welcome email.

**Tab B — Representatives**
Grouped by developer (developer logo + name on the left, like the user requested). Per rep: name, email, assigned developer, status (active / suspended), last activity. Actions: **Suspend**, **Reassign**, **Remove**, **Add new rep manually** (opens form: pick developer → enter email + name → "Send invite"). Manual invite sends the same broker-style "set your password" email; on first login they land in the Developer Portal scoped to that one developer.

**Tab C — Soft-deleted projects** (keep existing restore UI, unchanged)

Developers list everywhere else loses the pending/approve chips. Instead a small badge: "Represented by {N}" or "Unrepresented".

## 3. Database

New migration — no destructive changes:

```sql
-- Applications submitted by sales reps
create table public.developer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_user_id uuid not null,
  developer_id uuid not null references public.developers(id),
  status text not null default 'pending', -- pending | approved | rejected | changes_requested
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  about_developer text,
  drive_link text,
  brochure_urls jsonb default '[]',
  logo_url text,
  past_projects jsonb default '[]',
  current_projects jsonb default '[]',
  upcoming_projects jsonb default '[]',
  attachments jsonb default '[]',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Authorized representatives (scoped portal access)
create table public.developer_representatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  developer_id uuid not null references public.developers(id),
  status text not null default 'active', -- active | suspended | removed
  authorized_by uuid,
  authorized_at timestamptz not null default now(),
  application_id uuid references public.developer_applications(id),
  unique (user_id, developer_id)
);

-- Helper: is the current user the rep for this developer?
create or replace function public.is_developer_rep(_user uuid, _dev uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.developer_representatives
  where user_id = _user and developer_id = _dev and status = 'active') $$;
```

RLS:
- `developer_applications`: applicant can insert/select own rows; owner role can select/update all.
- `developer_representatives`: rep can select own row; owner role full access.
- `projects`, `project_images`, `project_documents`, `project_brochures`: ADD policy allowing UPDATE/INSERT when `is_developer_rep(auth.uid(), developer_id)`. Existing public-read and owner policies stay intact. No cross-developer edits possible.
- Remove the "trust_level auto-publish writes anything" branch from the existing `developer-auto-publish` edge function and replace it with: rep submits → writes scoped to their `developer_id` only → publishes when application is approved AND rep is active.

(Keep `developers.trust_level` column for back-compat but stop reading it in the UI.)

## 4. Invitation flow (mirrors broker onboarding)

- New edge function `invite-developer-rep` (owner-only). Input: `{ developer_id, email, name }`. Steps:
  1. Validate caller is owner via `requireOwnerAuth`.
  2. Create auth user via admin API with a random password.
  3. Insert `developer_representatives` row (status=active).
  4. Send password-set email using the existing Lovable auth email pipeline (`recovery` template, branded same as broker invite).
- On first login the rep is routed by `DeveloperHubRoutes` guard:
  - If they have a `developer_representatives` row → allow `/developer-hub`, force scope to their `developer_id`.
  - All `/owner/*`, `/admin/*`, `/crm/*` routes blocked by existing `OwnerGuard`/`AdminGuard` (already block non-owner users — verified).

## 5. Developer Hub scoping

- `DeveloperHubShell` reads the rep's `developer_id`. All project lists, editors, media uploads, brochure uploads, live editor, wizard — all filter by that single `developer_id`.
- "Switch developer" UI removed for reps (owner can impersonate via existing tooling).
- Sidebar shows the developer logo + name at the top so the rep always sees who they represent.

## 6. UI polish on existing developer lists

- Wherever developers are listed (admin directory, partnership panel Tab B), render the developer logo (`logo_url_processed || logo_url`) in a 40×40 champagne-padded tile next to the name. Uses existing `developerLogo.ts` util.

## 7. E2E + unit coverage

- Vitest: `is_developer_rep` permission helper; application status transitions.
- Playwright: owner approves application → rep receives invite → sets password → lands in scoped Developer Hub → can edit their developer's project → cannot load another developer's edit URL (gets 403).

## 8. Files

**New**
- `supabase/migrations/<ts>_developer_partnerships.sql`
- `supabase/functions/invite-developer-rep/index.ts`
- `src/pages/owner/DeveloperPartnershipPanel.tsx` (replaces DeveloperTrustPanel; old route redirects)
- `src/components/developer-partnerships/ApplicationCard.tsx`
- `src/components/developer-partnerships/RepresentativeRow.tsx`
- `src/components/developer-partnerships/AddRepDialog.tsx`
- `src/hooks/useDeveloperRepScope.ts`
- `mem://features/developer-portal/partnership-and-rep-scoping-standard.md`

**Edited**
- `src/routes/OwnerRoutes.tsx` — add `/owner/developer-partnerships`, redirect old `/owner/developer-trust`.
- `src/routes/DeveloperHubRoutes.tsx` — enforce rep scope guard.
- `src/pages/developer-hub/DeveloperHubShell.tsx` + sidebar — header logo + scope filter.
- `supabase/functions/developer-auto-publish/index.ts` — gate by `developer_representatives` instead of `trust_level`.
- Remove pending/approve chips from any directory views that currently read `trust_level`.

No existing developer projects, applications, or auth users are deleted — purely additive plus a UI swap.
