# Login → Mode Selection → Auto-CRM Lead by Category

## Goal

Restructure the user onboarding flow:

1. **Anonymous visitors** see no "Mode: Investor/Broker/Developer" badge and no role-specific tools — only a neutral public site.
2. **First, sign in / create account** is required before mode selection.
3. **After login**, the user is forced to pick: Investor / Broker / Developer (also reachable later from "Tell us who you are" section or the Mode switcher).
4. The selection **rewrites the entire site experience** (tools, dashboards, footer badge) — already partially wired via `UserModeContext` + `isInvestorMode` / `isBrokerMode` / `isDeveloperMode`.
5. The selection **automatically writes a CRM lead** in `crm_leads` with `contact_type = 'investor' | 'broker' | 'developer'`, so the admin can browse leads filtered by category in the back-end. Empty categories show a premium "No leads yet" empty state.
6. Mode is changeable any time from the Mode switcher; switching updates both `user_preferences.selected_mode` AND the corresponding CRM lead's `contact_type`.

## Current state (verified)

- `UserModeContext` already supports `investor | broker | investor_broker | developer` and persists to `user_preferences.selected_mode` + `localStorage`.
- `ModeSelectionModal` is mounted globally in `PopupLayer.tsx`. For logged-in users without a selection it is **forced open** (non-dismissable). For anonymous users it currently appears too — we will gate it behind login.
- Database already has everything we need:
  - `public.crm_leads` with column `contact_type` of enum `crm_contact_type` (values include `investor`, `broker`, `developer`, `client`, `vendor`, `other`). **No new tables needed.**
  - `user_preferences` already stores `selected_mode`.
- `CategorySelectorSection` ("Tell us who you are") already routes anonymous users to `/auth?preselect=...` and logged-in users to `setMode + /register/{cat}`.
- Footer's "Mode: Investor" badge reads from `UserModeContext` via `ModeSwitcher`.
- Admin CRM pages exist: `src/pages/AdminCRM.tsx`, `src/pages/AdminLeads.tsx`. We will add a category filter (Investors / Brokers / Developers) so empty categories surface a premium empty state.

## Plan

### 1. Hide the role badge & role-specific tools until selection is made

In `UserModeContext`, expose `hasMadeInitialSelection` (already present). In `ModeSwitcher` (footer) hide the badge entirely when:
- User is **not signed in**, OR
- User is signed in but `hasMadeInitialSelection === false`.

Show a neutral "Choose your role" link/button instead that opens the mode selection modal.

In role-conditional sections (`DeveloperPortalCTA`, future tool grids), short-circuit role-specific UI when `!hasMadeInitialSelection` — fall back to a generic public view.

### 2. Auth-first gate for the forced mode modal

Update `ModeSelectionModal`:
- For anonymous users, **do not auto-open as forced**. The modal opens only after login.
- "Tell us who you are" section continues to work for anonymous users — it routes to `/auth?preselect={cat}` (existing behaviour). After auth, the preselected mode is auto-applied.
- After login, if `user_preferences.selected_mode` is missing, force the modal open until a choice is made (existing logic — just confirm anonymous case is exempt).

In `Auth.tsx` (sign-in / sign-up page), read `?preselect=` and `?mode_select=` from the URL. On successful auth, immediately call `setMode(preselect)` and skip the modal, so the flow is seamless from "Tell us who you are" → register → land logged-in with role applied.

### 3. Auto-create a CRM lead on mode selection

Add an edge function `register-mode-lead` (called from `setMode` in `UserModeContext`):

- Input: `{ user_id, mode }`.
- Server-side (service role) upserts a row in `public.crm_leads`:
  - Looks up by `(owner_user_id = user_id, source = 'self_registration')`.
  - If exists: updates `contact_type = mode` and `updated_at = now()`.
  - If not: inserts with:
    - `contact_type` = `'investor' | 'broker' | 'developer'` (map `investor_broker` → `investor` and tag `broker` as well via `tags` array).
    - `owner_type = 'company_assigned'`, `owner_user_id = user_id`.
    - `full_name`, `email_normalized`, `email_lower`, `phone_e164` pulled from `auth.users` + `profiles`.
    - `source = 'self_registration'`, `lead_source_type = 'mode_selection'`.
    - `pipeline_stage = 'new'`, `lead_intent` = derived from mode (e.g. `'sell_side'` for broker, `'buy_side'` for investor, `'project_launch'` for developer).
    - `tags = ['{mode}', 'self-registered']`.
- Returns the lead id.

Wired in `setMode`:
```ts
if (user?.id) {
  // existing user_preferences upsert
  await supabase.functions.invoke('register-mode-lead', { body: { mode: newMode } });
}
```

The function uses `requireOwnerAuth`-style validation (auth header → user id) so users can only create/update their own self-registered lead. RLS on `crm_leads` already restricts admin-only reads; service role bypasses RLS for the upsert.

### 4. Admin CRM — category filtering with premium empty state

In `src/pages/AdminCRM.tsx` (or `AdminLeads.tsx`, whichever hosts the lead browser), add a top-level segmented filter: **All • Investors • Brokers • Developers**.

- Filter the existing query by `contact_type`.
- When the filtered list is empty, render a champagne-themed empty state card:
  > "No {category} leads registered yet."
  > Subcopy: "When investors / brokers / developers register on the platform, they'll appear here automatically."
  Icon: `IconTile` with the matching tone (blue for investor, gold for broker, emerald for developer).

### 5. "Change mode anytime" — keep CRM in sync

When the user switches mode via the `ModeSwitcher` dropdown, `setMode` already runs. Because `register-mode-lead` upserts on `(owner_user_id, source='self_registration')`, switching mode just updates the existing lead's `contact_type` — no duplicate rows, history preserved via `updated_at`.

Add an audit row in `crm_action_logs` from the edge function on each change so admins see the role-switch history.

## Technical details

### Files to edit

- `src/contexts/UserModeContext.tsx` — call `register-mode-lead` after `setMode` for logged-in users.
- `src/components/ModeSelectionModal.tsx` — only force-open when `user` is logged in (already correct); minor copy tweak.
- `src/components/ModeSwitcher.tsx` — hide badge when anonymous OR `!hasMadeInitialSelection`; show "Choose your role" CTA instead.
- `src/pages/Auth.tsx` (or equivalent) — on successful auth, if `?preselect=` is present, call `setMode(preselect)` before redirect.
- `src/components/home/DeveloperPortalCTA.tsx` and any other role-gated home blocks — guard with `hasMadeInitialSelection` so anonymous visitors don't see role-targeted CTAs.
- `src/pages/AdminCRM.tsx` (or `AdminLeads.tsx`) — add category filter chips + premium empty state component.

### Files to create

- `supabase/functions/register-mode-lead/index.ts` — edge function (service-role upsert into `crm_leads`, log to `crm_action_logs`).
- `src/components/admin/EmptyLeadCategoryState.tsx` — reusable champagne empty state.

### Database

No schema changes required. `crm_leads.contact_type` (enum `crm_contact_type`) already supports `investor` / `broker` / `developer`. We only **insert/update data**, which uses the data tool (no migration).

Add one supporting index for fast category filtering:
```sql
CREATE INDEX IF NOT EXISTS idx_crm_leads_contact_type_owner
  ON public.crm_leads (contact_type, owner_user_id);
```
(This is a schema change → migration tool.)

## Result flow

```text
Anonymous visitor
  ↓ (no role badge, no role-specific tools)
Clicks "Tell us who you are" → picks Investor
  ↓
/auth?preselect=investor  (sign in / sign up)
  ↓ on auth success
setMode('investor') → user_preferences updated
                    → crm_leads upsert { contact_type: 'investor' }
  ↓
Redirect to /  (badge "Mode: Investor" now shown, investor tools active)
  ↓ later
User opens Mode switcher → picks Broker
  ↓
setMode('broker') → user_preferences + crm_leads.contact_type updated → audit log
```

Admin opens **CRM → Leads → Brokers** tab and instantly sees the broker; switching to **Developers** shows the premium "No developers yet" empty state until someone registers.
