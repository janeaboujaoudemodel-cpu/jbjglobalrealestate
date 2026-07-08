
## Goal

Build a premium JBJ-branded public landing page that gates the entire site. Unauthenticated visitors can only see the landing page, a Sign Up flow, a Login flow, or submit a Lead form. Everything else redirects to the gate. Landing sections are editable from a backend Company Profile builder.

## Design system (locked to existing JBJ)

- Palette: pearl / champagne backgrounds, emerald `#064E3B` + black accents, white text ONLY on emerald/black, dark text ONLY on champagne/pearl. No blue. No cheap gradients.
- Typography: existing Cormorant Garamond headings + current body font. No new fonts.
- Buttons: reuse existing JBJ button variants (`variant="premium"` / emerald primary + champagne secondary). No new button styles.
- Enforced by existing Contrast Guard + Global Visual Identity System memories.

## 1. Access gate

New component `SiteAccessGate` wrapping the app in `App.tsx`:

- Reads Supabase session via existing `useAuth`.
- If session exists → render children as today.
- If no session → check current path:
  - Allowed public paths: `/`, `/welcome`, `/login`, `/signup`, `/reset-password`, `/auth/*`, `/legal/*`, static asset paths.
  - Any other path → `<Navigate to="/welcome" replace state={{ from: pathname }} />` so we can send them back after login.
- SEO-safe: server returns 200 on `/welcome` with real title/description; bots crawling `/welcome` still get content.

## 2. Public landing page `/welcome`

New route + page `src/pages/Welcome.tsx` composed of section components rendered from a config fetched from `public_gate_sections`:

Section types (structured editor, fixed set):
1. `hero` — headline, sub-headline, background image/video, CTA buttons (Sign Up / Lead form).
2. `overview` — platform/service intro, 3-column icons.
3. `video` — embedded demo video with poster.
4. `features` — 3–6 benefit cards.
5. `solutions` — property solutions preview grid (Buy / Sell / Rent / Off-Plan / Investment / Golden Visa).
6. `lead_cta` — full-width band with "Get in touch" opening lead popup.
7. `login_signup` — dual card with Login and Sign Up buttons.

All sections read `title`, `body`, `media`, `cta_label`, `cta_action` from DB with sensible defaults so first render works before any admin edits.

Responsive: verified at 1440, 1180 (laptop), 1024 iPad landscape, 768 iPad portrait, 390 mobile.

## 3. Sign Up flow

New page `/signup` with a single-column premium form:

Fields: full name, email, phone (with country code), nationality (searchable select), preferred language, user type (buyer / seller / investor / tenant / landlord / broker / developer — single select), notes, and multi-select service pills:
Buy, Sell, Rent, List, Off-Plan, Property Management, Investment Advisory, Golden Visa, Mortgage Support, Interior Design, Company Setup.

Zod validation client + edge function. Creates Supabase auth user (email + password), assigns new role `client` in `user_roles`, writes profile fields to existing `client_profiles` table (extend with missing columns), and inserts a matching `leads` row tagged `source_page='signup'`.

After success → session established → redirect to intended path or `/`.

## 4. Lead form popup

Reusable `<LeadFormDialog />` triggered from hero, `lead_cta` section, and floating CTA. Captures: name, email, phone, nationality, language, services, user type, notes. No password. Writes to existing `leads` table with:
- `source_page` (route where opened)
- `user_type`, `services[]`, `language`, `nationality`
- `status = 'new'`, `assigned_to = null`

Popup can be dismissed; visitor stays on `/welcome` (still gated).

## 5. Login flow

New page `/login` — email + password. Reuses existing Supabase auth. After sign in, redirect back to `state.from`.

## 6. Backend

### Migration (single)

- Extend `app_role` enum with `'client'`.
- `ALTER TABLE public.client_profiles` — add any missing columns: `nationality text`, `preferred_language text`, `services text[]`, `user_type text`, `notes text`, `source_page text`, `signup_ip text`.
- `ALTER TABLE public.leads` — add same fields if missing (`services text[]`, `user_type text`, `preferred_language text`, `nationality text`, `source_page text`).
- New table `public.public_gate_sections`:
  - `id`, `kind` (enum hero/overview/video/features/solutions/lead_cta/login_signup), `position int`, `visible bool`, `title text`, `subtitle text`, `body text`, `media jsonb`, `cta jsonb`, `props jsonb`, `created_at`, `updated_at`.
  - GRANT SELECT to `anon, authenticated`; ALL to `service_role`. Owner/admin write via role check.
  - RLS: public read visible=true; write only for `owner` / `super_admin` via `has_role`.
- Seed 7 default sections so `/welcome` renders immediately.

### Edge functions

- `signup-client` — validates payload, creates auth user (email confirm off unless already enabled), inserts `client_profiles` + `user_roles(client)` + `leads` row.
- `submit-lead` — validates payload, inserts `leads` row, returns `{ ok: true }`.

Both use `corsHeaders` and Zod validation.

## 7. Backend editor: Company Profile / Public Gate Page

New owner-only route `/owner/public-gate` (added to existing Owner Hub nav):

- Lists sections from `public_gate_sections` ordered by `position`.
- Drag-and-drop reorder (`@dnd-kit/sortable`, already installed).
- Per-section actions: edit (opens side sheet with fields for that kind), duplicate, delete, toggle visibility.
- "Add section" picks a kind from the fixed enum, inserts at end.
- Media upload uses existing `owner_document_assets` bucket pattern.
- Live preview link opens `/welcome` in a new tab.

Guarded by existing `useOwnerAuth` middleware.

## 8. Files to add / edit

Add:
- `src/pages/Welcome.tsx`
- `src/pages/Signup.tsx`
- `src/pages/Login.tsx` (only if a dedicated one doesn't already exist; otherwise reuse)
- `src/components/gate/SiteAccessGate.tsx`
- `src/components/gate/LeadFormDialog.tsx`
- `src/components/gate/sections/{Hero,Overview,VideoSection,Features,Solutions,LeadCta,LoginSignup}.tsx`
- `src/components/owner/public-gate/{PublicGateEditor,SectionCard,SectionEditSheet}.tsx`
- `src/hooks/usePublicGateSections.ts`
- `supabase/functions/signup-client/index.ts`
- `supabase/functions/submit-lead/index.ts`

Edit:
- `src/App.tsx` — mount `SiteAccessGate`, register `/welcome`, `/signup`, `/login`, `/owner/public-gate`.
- Owner Hub nav — add "Public Gate Page" entry.

Do NOT touch: existing project detail, hub, developer, or brochure code.

## 9. Validation before completion

Playwright scripts capture and I visually inspect:
- `/welcome` at 1440, 1180, 1024, 768, 390.
- Signup popup + Login popup states.
- Lead form popup submission → toast success.
- Owner editor: reorder, edit, hide/show, duplicate, add.
- DB check: `select * from leads order by created_at desc limit 1` after a submission; `select * from client_profiles` after a signup.
- Contrast Guard: no blue, no white-on-champagne, no dark-on-emerald.

I'll only mark the task done after screenshots + DB checks pass.

## Technical notes

- No new fonts, no new colors, no new button variants — all reuse existing tokens/variants.
- Signup uses email/password with `emailRedirectTo: window.location.origin` to keep future email confirm working.
- Session state via existing `onAuthStateChange` listener; gate uses `getUser()` for trusted checks.
- Rate limit lead submissions in `submit-lead` via existing `function_rate_limits` table pattern.
