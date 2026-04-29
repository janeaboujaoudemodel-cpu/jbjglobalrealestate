## Goal

Make category selection (Investor / Broker / Developer) a first-class step of every login, capture full per-category profile data into the backend, and give the owner a single admin view that counts and lists users per category.

---

## 1. Homepage — Category Selection Block

Add a new section near the top of the homepage (`src/pages/Index.tsx`) called **"I am a…"** with three premium cards:

- **Investor** — TrendingUp icon, "Browse properties, track your portfolio"
- **Broker** — Briefcase icon, "Access CRM, leads & broker tools"
- **Developer** — Building2 icon, "Submit projects & manage launches"

Click behavior:
- If **not logged in** → navigate to `/auth?returnTo=/welcome&preselect=<category>`.
- If **logged in** → call `setMode(category)`, persist to backend, then navigate to that category's onboarding page (see §3).

New component: `src/components/home/CategorySelectorSection.tsx`. Inserted after the hero, before existing sections. Monochrome styling per Core memory (white surface, black text, Inter font); orange used only for accent dots, not buttons.

---

## 2. Auth Flow — Always Funnel Through /welcome

Edit `src/pages/Auth.tsx`:

- After **sign-in success** (currently `navigate("/")` on lines 319 & 352): check `user_role_selections.selected_role` and `crm_users_profile`/`broker_profiles`. If no category recorded → `navigate("/welcome")`. Otherwise honor `returnTo` param or go to `/`.
- After **sign-up success** (already routes to `/welcome`): pass through `?preselect=<category>` from URL so the chosen card auto-highlights.
- Honor `?returnTo=` so the homepage card flow returns the user to the right onboarding step.

Edit `src/pages/Welcome.tsx`:

- Read `?preselect=` and pre-select that card.
- After category save, instead of jumping straight to dashboards, route to the **registration form** for that category if the registration is incomplete:
  - `developer` → `/register/developer`
  - `broker` → `/register/broker`
  - `investor` → `/register/investor`
- If a registration row already exists (status `submitted` or `approved`), skip the form and go to the dashboard as today.

---

## 3. Authenticated Registration Forms

Three new pages under `src/pages/register/` (added to `src/routes/PublicRoutes.tsx` behind `<AuthGate>`):

### `/register/investor` — `RegisterInvestor.tsx`
Fields:
- Full name, phone (E.164), nationality, residency status
- Investor type: `currently_invested` | `looking_to_buy`
- If invested: list of properties owned (project, unit, purchase price, purchase date) — repeatable
- If looking: budget range, preferred areas (multi), unit type, timeline, financing (cash/mortgage), investment goal (rental yield / capital growth / Golden Visa)
- Notes / requirements (textarea)

Saves into:
- `user_role_selections` (basic identity)
- `client_investors` (one row per owned property)
- New table `investor_intake` (looking-to-buy preferences, see §5)

### `/register/broker` — `RegisterBroker.tsx`
Fields:
- Full name, phone, nationality, photo
- Current company / brokerage, years experience, RERA / BRN number
- Specializations (multi: off-plan, secondary, rentals, commercial, luxury)
- Languages, preferred areas
- CV upload (PDF/DOCX → Supabase Storage `broker-documents` bucket)
- RERA card upload, Emirates ID upload (already supported by `broker_profiles`)
- LinkedIn URL, short bio

Saves into `broker_profiles` (existing table — covers nearly all fields). New file uploads use existing storage pattern from `BrokerAccount.tsx`.

### `/register/developer` — `RegisterDeveloper.tsx`
Reuse the existing `DeveloperCompanyRegistration` page logic but expose it under the unified `/register/developer` route too. No schema change — saves to `developer_registrations`.

All three forms use the existing `FormDraftBar` for autosave UX (matches `JoinInvestorList.tsx` pattern).

---

## 4. Wiring "Send Registration Email" Form Width

Carry-over from prior message: the Bulk Send / Registration dialog's email column is clipped. Widen `BulkSendDialog`'s `DialogContent` to `max-w-[900px]` and let the email column use `min-w-[280px]` with `truncate` removed so the address is fully visible.

---

## 5. Backend Changes (one migration)

```sql
-- Investor intake (for "looking to buy" pipeline)
create table public.investor_intake (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'submitted',     -- submitted | reviewing | matched
  intent text not null,                          -- 'currently_invested' | 'looking_to_buy'
  budget_min numeric, budget_max numeric, currency text default 'AED',
  preferred_areas text[], unit_types text[],
  timeline text, financing text, investment_goal text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.investor_intake enable row level security;
create policy "owner read own"   on public.investor_intake for select using (auth.uid() = user_id);
create policy "owner insert own" on public.investor_intake for insert with check (auth.uid() = user_id);
create policy "owner update own" on public.investor_intake for update using (auth.uid() = user_id);
create policy "admins read all"  on public.investor_intake for select using (public.has_role(auth.uid(),'admin'));

-- Unified category registry view (read-only, used by admin page)
create or replace view public.user_categories_v as
  select urs.user_id, urs.email, urs.full_name, urs.phone_e164,
         urs.selected_role::text as category, urs.created_at
  from public.user_role_selections urs;
grant select on public.user_categories_v to authenticated;
```

(`developer_registrations`, `broker_profiles`, `client_investors` already exist — no schema change there.)

---

## 6. Admin "Categories" Page

New route `/admin/categories` (page: `src/pages/AdminCategories.tsx`, linked from existing `Admin.tsx` sidebar). Owner/admin-only via `requireOwnerAuth`.

Three tabs: **Investors · Brokers · Developers**. Each tab shows:

- Total count badge
- Searchable table: name, email, phone, country, registration status, created date
- Row click → drawer with the full submitted profile + uploaded documents
- CSV export per tab

Data sources:
- Investors: `user_categories_v` filtered to `investor` + `investor_intake` + `client_investors`
- Brokers: `broker_profiles`
- Developers: `developer_registrations`

---

## Files

**Created**
- `src/components/home/CategorySelectorSection.tsx`
- `src/pages/register/RegisterInvestor.tsx`
- `src/pages/register/RegisterBroker.tsx`
- `src/pages/register/RegisterDeveloper.tsx`
- `src/pages/AdminCategories.tsx`
- `supabase/migrations/<ts>_investor_intake_and_categories_view.sql`

**Edited**
- `src/pages/Index.tsx` — mount `CategorySelectorSection`
- `src/pages/Auth.tsx` — post-login category check + `preselect` passthrough
- `src/pages/Welcome.tsx` — `preselect` support, route to `/register/<category>` when intake missing
- `src/routes/PublicRoutes.tsx` — register the 4 new routes (3 forms + admin page)
- `src/components/crm/BulkSendDialog.tsx` — wider dialog so email column is fully visible
- `src/pages/Admin.tsx` — add "Categories" link

---

## Out of scope (will note for follow-up)
- The "JavaScript required" message on opening pack/Drive links — that is Google Drive's own preview page when opened inside the in-app iframe; needs a separate fix to open Drive links in a new tab. I'll address it in a follow-up unless you want it bundled here.
