# Intelligent Role-Based Registration & CRM Segmentation

Replace the single generic signup with a multi-step wizard whose fields adapt to the selected user category, and turn the backend Users module into a full CRM directory with stats, advanced filters, and per-profile actions.

## 1. Registration Wizard (public, gated site)

Replace `SignupDialog` with a full-page route `/signup` (also mountable in a dialog from the gate) built as a 3-step wizard:

**Step 1 — Category** (required, single-select cards):
Investor, Buyer, Seller, Broker/Agency, Developer, Landlord, Tenant, Partner, Service Provider, Media/Press, Other.

**Step 2 — Category-specific fields** (dynamic, only relevant fields):
- **Developer**: Developer Name (searchable dropdown from `developers`/`crm_developer_registry`), Office Location, Position (fixed list), Years in Real Estate, Years with Current Developer, Previous Developer.
- **Broker**: Brokerage Company (searchable), Office Location, Position, Years of Experience, Areas of Expertise (multi), Communities Covered (multi), Languages, RERA Number, Team Size.
- **Investor**: Nationality, Country of Residence, Invested in UAE before (Y/N → conditional Number of Investments + Experience), Investment Interests (multi pills: Off-Plan, Ready, Residential, Commercial, Luxury, Holiday Homes, Land, Hotel, Mixed Use), Budget, Timeline, Preferred Contact Method/Time.
- **Buyer**: Buying For, Budget, Preferred Communities, Bedrooms, Ready/Off-Plan, Cash/Mortgage, Timeline.
- **Seller**: Property Type, Community, Area, Estimated Value, Timeline.
- **Landlord / Tenant / Partner / Service Provider / Media / Other**: sensible minimal field sets (property portfolio, lease preferences, partnership type, service offered, outlet name, free-text) — reuses common controls.

**Step 3 — Common fields (all categories)**:
Full Name, Email, Password, Mobile, WhatsApp, Country, Nationality, Preferred Language, Preferred Contact Method, Preferred Contact Time, Services Interested In (multi pills), Notes, consent checkboxes.

UX: horizontal progress rail, "Back / Continue" bottom bar, inline zod validation, JBJ palette (pearl/champagne/emerald/black), Cormorant headings, no new fonts/colors/button variants. Mobile-first single column; desktop two-column for step 2 & 3.

## 2. Backend — CRM Profile Storage

New table `crm_user_profiles` (one row per registered user, editable):
- `user_id` (FK `auth.users`, unique), `category` (enum), `full_name`, `email`, `phone`, `whatsapp`, `country`, `nationality`, `preferred_language`, `preferred_contact_method`, `preferred_contact_time`, `services` (text[]), `notes`, `status` ('active'|'inactive'), `assigned_to` (uuid), `tags` (text[]), `internal_labels` (text[]), `last_login_at`, `archived_at`, `merged_into_id`, `source_page`, `created_at`, `updated_at`.
- `category_data` jsonb for category-specific fields (developer/broker/investor/... payload) — flexible schema, indexed with GIN.
- Denormalized filter columns for fast segmentation: `position`, `company_name`, `years_experience`, `budget_min`, `budget_max`, `investment_experience`, `communities` (text[]).

Supporting tables:
- `crm_profile_notes` (profile_id, author_id, body, created_at).
- `crm_profile_activity` (profile_id, type, payload jsonb, created_at) — auto-append on register/edit/login/tag/assign.

RLS + GRANTs:
- Owner/admin: full read/write on all rows.
- The user themselves: read/update only their own row (limited fields).
- Anon: none.
- `service_role`: full (edge functions).

Enum: add `'landlord'`, `'tenant'`, `'partner'`, `'service_provider'`, `'media'`, `'other'` values to `app_role` (or use a separate `crm_category` enum — recommended to avoid coupling with permission roles). Plan uses a dedicated `crm_category` enum; `app_role` stays `client` for all self-registered users.

## 3. Edge Function — `register-user`

Replaces `signup-client`. Zod-validates the full wizard payload, creates the auth user, assigns `client` role, upserts `crm_user_profiles` (+ writes `category_data`), inserts `leads` row for existing CRM continuity, logs `crm_profile_activity` entry `type='registered'`. Returns `{ ok, user_id }`.

## 4. Owner CRM Directory `/owner/users`

Rebuild the existing Users admin page into a full CRM directory.

**Stats header** (cards): Total Users, Investors, Developers, Brokers, Buyers, Sellers, Landlords, Tenants, Partners, Service Providers, Media, Other. Reactive to filters.

**Filter rail** (collapsible left column):
Category, Position, Company/Developer/Brokerage Name, Nationality, Country, Preferred Language, Investment Experience, Years of Experience, Communities Covered, Budget range, Services Interested In, Registration Date range, Last Login range, Status.

**Table**: sortable columns, saved views, bulk selection, CSV export.

**Per-row actions**: Edit, Notes, Tags/Labels, Activity Timeline, Assign to Team Member, Duplicate, Archive, Merge Duplicate, Export.

**Profile detail drawer**: tabs — Overview, Category Data (editable), Notes, Tags, Activity Timeline, Assignments.

Segmentation examples work out of the box: "All CEOs from Developer companies", "All Sales Directors", "All Property Consultants".

## 5. Files

**New**
- `src/pages/Signup.tsx` (wizard shell, route `/signup`)
- `src/components/signup/CategoryStep.tsx`
- `src/components/signup/CategoryFields/{Developer,Broker,Investor,Buyer,Seller,Landlord,Tenant,Partner,ServiceProvider,Media,Other}Fields.tsx`
- `src/components/signup/CommonStep.tsx`
- `src/components/signup/constants.ts` (positions, services, communities, budgets)
- `src/hooks/useDeveloperSearch.ts`, `src/hooks/useBrokerageSearch.ts`
- `src/pages/owner/OwnerCRMDirectory.tsx`
- `src/components/owner/crm/{StatsBar,FilterRail,UsersTable,ProfileDrawer,NotesTab,ActivityTab,MergeDialog,AssignDialog}.tsx`
- `src/hooks/useCrmProfiles.ts`, `useCrmProfileMutations.ts`
- `supabase/functions/register-user/index.ts`
- Migration for `crm_category` enum, `crm_user_profiles`, `crm_profile_notes`, `crm_profile_activity`, GRANTs, RLS, triggers.

**Edited**
- `src/components/gate/SignupDialog.tsx` → thin dialog that mounts the wizard, or redirects to `/signup`.
- `src/routes/StandaloneRoutes.tsx` → add `/signup`.
- `src/routes/OwnerRoutes.tsx` → add `/owner/users` (or upgrade existing route).
- Owner nav → link to new CRM directory.

## 6. Validation

Playwright screenshots: each wizard step per category at desktop/laptop/iPad landscape+portrait/mobile; owner directory with stats + filters applied; profile drawer edit; DB row inspection after test registration.

## Technical Notes

- `crm_category` as a Postgres enum keeps filtering fast and typo-proof; `category_data jsonb` keeps per-category fields flexible without schema churn.
- Denormalized filter columns are populated in the edge function on insert/update so the directory filter queries stay index-friendly.
- Deduping merge writes `merged_into_id` on the losing row and moves notes/activity to the winner.
- No changes to existing owner auth model; all self-registered users remain role `client`.
- Reuse existing JBJ tokens/buttons; no new palette or typography.
