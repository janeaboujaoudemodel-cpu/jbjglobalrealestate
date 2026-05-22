# Merge /brokers into /team + Owner-managed Visibility Controls

## What you'll see

1. `/brokers` and `/our-brokers` will redirect to `/team`. The Brokers directory is removed as a standalone page — its contents are merged into the existing "Meet the Team" page as a new **Brokers** section, without breaking the existing department layout.
2. A new owner-only **Team Visibility** control bar appears at the top of `/team` (only visible when you are signed in as owner). It contains:
   - **Page master switch** — when OFF, the entire `/team` page is hidden from the public (visitors get a 404, no redirect). Owner still sees it.
   - **Hide all AI personas** toggle — one click hides every team member where `isAI = true`.
   - **Per-member eye toggle** — each card shows a small eye icon (owner-only) to hide/show that individual member from the public page. AI personas have the same toggle so you can re-enable any specific persona if you want.
3. Defaults applied on first save:
   - Page master = **visible**.
   - "Hide all AI personas" = **ON**, so only real humans + activated brokers show.
   - Roy Davy is removed/hidden (see "Roy" below).
4. The new **Brokers** section on `/team` is sourced from real activated brokers in `crm_brokers` (the CRM table — same source as the admin Broker Registry). It currently shows only Jane (the single active broker). All the 128 sample/demo brokers from `src/config/brokers-data.ts` are NOT shown on `/team` — they were placeholders.

## Backend (Lovable Cloud)

New table `public.team_visibility`:
- `member_id` text — primary key. Special keys: `__page__` for the master page switch and `__hide_ai__` for the bulk AI toggle. All other keys are team-member ids (e.g. `david-thornton`) or broker uuids prefixed `broker:<uuid>`.
- `is_visible` boolean — default true.
- `updated_by` uuid, `updated_at` timestamptz.

RLS:
- Public can `SELECT` (so the page can honor visibility for visitors).
- Only owner/admin (via existing `has_role`) can `INSERT/UPDATE/DELETE`.

## Frontend changes

- `src/pages/MeetTheTeam.tsx`
  - Load `team_visibility` once at mount.
  - If `__page__` = false and viewer is NOT owner → return `<NotFound />`.
  - Filter departments: apply per-member visibility + `__hide_ai__` flag.
  - Add new "Brokers" department block (after Sales) pulling from `crm_brokers` for activated brokers only.
  - Owner-only `TeamVisibilityBar` component pinned at the top.
  - Owner-only eye toggle button on each `TeamMemberCard` and broker card.

- `src/routes/PublicRoutes.tsx`
  - `/brokers` → `<Navigate to="/team" replace />`.
  - Keep `/team` route.

- `src/components/team/TeamVisibilityBar.tsx` (new) — three controls + live counts.
- `src/hooks/useTeamVisibility.ts` (new) — fetch + mutate visibility map, cached, owner-write.

## "Roy" / "Roy Davy"

Roy is not in `src/config/team-members.ts` or `brokers-data.ts`. He is presumably a row in `crm_brokers`. The owner can hide him from `/team` with the new eye toggle. If you want him fully removed from the CRM, say so and I'll add a "Mark inactive" action on the BrokersRegistry too.

## Out of scope (won't change unless you ask)

- The internal `/owner/crm` brokers registry stays as-is — its admin filters already control activation/status.
- The 128 demo brokers in `brokers-data.ts` are no longer rendered anywhere public; the file itself stays in case other internal screens reference it.
