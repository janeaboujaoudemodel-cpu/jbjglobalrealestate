## Scope

Five related fixes across Academy, List Property, and Careers. UI/contrast work + one new backend flow (Academy access requests).

---

## 1. JBJ Academy — proper "Request Access" form + admin approval

**Today:** Clicking "Request Access" on a locked module/book fires `useCreateBrokerRequest` silently and toasts "Request submitted". No form, no contact details captured, no clean approval surface.

**New flow:**

1. **New DB table** `academy_access_requests` (via migration):
   - `id`, `user_id` (nullable for guests), `full_name`, `email`, `phone`, `note`, `requested_item_type` (`module|book`), `requested_item_id`, `requested_item_title`, `status` (`pending|approved|rejected`), `decided_by`, `decided_at`, `created_at`.
   - RLS: insert allowed to anyone authenticated; select/update restricted to owner role via `has_role`. GRANTs for `authenticated` + `service_role`.

2. **New modal** `src/components/broker-education/AcademyAccessRequestModal.tsx`:
   - Form fields: Full name, Email, Phone, Note (textarea — "Why do you need access?").
   - Pre-fills name/email from `useAuth()` profile when available.
   - On submit → insert into `academy_access_requests` → success state inside modal ("Your request has been received. We'll email you once it's approved."). Replace the silent toast.

3. **Wire into `src/pages/broker/BrokerLearning.tsx`**: replace current `requestAcademyAccess` mutate call with opening this modal, passing the item id/type/title.

4. **Admin approval surface** at `/owner/academy-access` (new page `src/pages/owner/OwnerAcademyAccessQueue.tsx`, owner-gated):
   - Lists pending requests with name/email/phone/note/requested item.
   - **Approve** → updates row to `approved`, grants academy access (insert into existing `broker_academy_access` / equivalent grant table — verify exact table during implementation), and invokes new edge function `academy-access-approved-email` which sends a branded email to the registered address with login CTA pointing to `/auth?email=<their email>` + instructions: "Sign in with this email to unlock JBJ Academy."
   - **Reject** → status `rejected`, optional reason.
   - Add link from existing owner sidebar.

5. **Email template**: clean branded HTML (champagne + ink + gold hairline + JBJ monogram), single navy CTA "Sign In to Access", body explains the email registered in the form is now the access key.

---

## 2. `/list-property` — contrast + blue-CTA fixes

File: `src/pages/ListProperty.tsx` (+ any child components for the "Purpose / How would you like to list?" card and the "How would you like to add your property?" section).

- **AI Assist pill** ("AI assist‑ed" rendering white-on-white inside the rounded card on hero): repaint to ink `#1A1A1A` on champagne; rename label to **"AI Assistant"** (not "AI Assisted").
- **Purpose row** (For Sale / For Rent) and **How-to-list row** (Manual / AI Assistant / Browse): all labels + icons in navy `#102540`. Active pill stays `jj-pill-active`.
- **"How would you like to add your property?"** section cards (List Manually / List with AI):
  - Card titles + icons → navy `#102540`.
  - Section heading + "FULL CONTROL" / "AI‑ASSISTED" eyebrows → navy.
  - "Start" CTA buttons → filled navy (`jj-cta-dark`), white text + white arrow at rest AND hover. No outline-white variant.
- **"No submission yet"** empty-state block:
  - Icon + heading → navy.
  - "Start your first listing above" + "Track the status of every property" + "Or browse existing listings →" — all navy with arrow in navy.
  - "Open Full Dashboard" CTA → `jj-cta-dark` (navy + white text + white icon).

All edits scoped to `ListProperty.tsx` + its inline cards; uses existing locked primitives (`jj-cta-dark`, `jj-pill-active`, `IconTile` tone="ink"/"gold").

---

## 3. Careers page — `/join` → `/careers` canonical URL

- In `src/routes/PublicRoutes.tsx`: keep `JoinApplication` mounted on `/careers` as the **canonical** route; `/join` becomes a `<Navigate to="/careers" replace />` redirect (preserves any deep links).
- Update internal links (`Footer`, `GlobalHeader`, nav, sitemap, SEO canonical/og:url, JSON‑LD) from `/join` → `/careers`.
- Update `public/sitemap.xml` and `public/robots.txt` if `/join` is listed.
- Update SEO head inside `JoinApplication` (`<title>`, `<meta description>`, canonical, og:url) to use `/careers`.

---

## 4. Careers page — hide from Investor mode

- Wrap `/careers` (and `/careers/apply`) in `<ModeRequiredRoute modes={['broker','developer']} />` so it's blocked when `mode === 'investor'`.
- Hide the "Careers" entry from header/footer/global nav when current mode is investor (mirror existing mode-aware nav pattern).

---

## 5. Careers page — visual polish

**a) "Open Positions" / "Live Roles" band** (`src/pages/JoinApplication.tsx` — the navy hero band containing the rectangles you circled):
- `LIVE ROLES` pill, `Open Positions` H2, sub "Tap Apply on any role to auto‑select it in the form below" → all **white** (currently rendering dark on dark).
- Search input on that band → white placeholder + white icon, transparent fill with white hairline border.

**b) "Meet Jessica" card**:
- Background stays champagne; **avatar circle ring + bot icon stroke → navy/ink** so the icon is visible against the champagne ring (today the icon is white inside a champagne ring = invisible).
- "AI INTERVIEW ASSISTANT" pill → ink on champagne with gold hairline.

**c) FAQ accordion** (`src/components/careers/CareersFAQ.tsx`):
- Active/open FAQ item gets a **navy filled circle icon** on the right (replacing the empty chevron position circled in the screenshot) — clear visual indicator of which question is expanded. Closed items keep the gold chevron.
- Keep champagne card shell + gold hairline.

---

## Technical changes (file map)

```text
NEW
  supabase/migrations/<ts>_academy_access_requests.sql   # table + GRANTs + RLS
  supabase/functions/academy-access-approved-email/index.ts
  src/components/broker-education/AcademyAccessRequestModal.tsx
  src/pages/owner/OwnerAcademyAccessQueue.tsx

EDIT
  src/pages/broker/BrokerLearning.tsx        # open modal instead of silent mutate
  src/pages/ListProperty.tsx                 # contrast + navy CTAs + "AI Assistant" label
  src/components/careers/CareersFAQ.tsx      # navy circle on active item
  src/pages/JoinApplication.tsx              # white text on navy band, Jessica icon fix,
                                              # SEO canonical → /careers
  src/components/careers/PremiumCareersHero.tsx  # (if hero owns the white-text band)
  src/routes/PublicRoutes.tsx                # /join → Navigate to /careers
                                              # /careers gated to broker|developer modes
  src/components/Footer.tsx                  # update /join links → /careers, hide for investor
  src/components/GlobalHeader.tsx            # same
  src/components/navigation/GlobalVerticalNav.tsx  # same
  public/sitemap.xml                         # /join → /careers
  .lovable/plan.md                           # this plan
```

## Verification

For every change I will:
1. Build passes (automatic).
2. Open the affected route in the in-browser preview (`/list-property`, `/broker/learning`, `/careers`, `/owner/academy-access`), take **full-page screenshots**, and visually confirm:
   - No white-on-white / dark-on-dark text remains in the called-out spots.
   - Academy "Request Access" opens the new form modal; submitting writes a row (verified via DB read).
   - Approve flow in owner queue updates status and dispatches the email (edge function log).
   - `/join` 301-style redirects to `/careers` in the address bar.
   - Investor mode hides the Careers link and `/careers` redirects away.
3. Re-screenshot after each fix to confirm pixel-level correctness — no claim of "done" without the visual.

## Out of scope

- No removal of any existing Academy book/module data.
- No change to the existing broker certification flow (separate gate).
- No reskin of the rest of the JoinApplication page beyond the band + Jessica + FAQ accordion polish above.
