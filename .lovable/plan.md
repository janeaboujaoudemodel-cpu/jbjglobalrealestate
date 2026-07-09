# Phase 2 — Foundation Batch (Batch A)

Ship the platform foundation first so monetization in Batch B lands on a solid site. Batch A covers workstreams 1-4 and 8. Batch B (5-7) is scoped at the end.

---

## 1. UI fixes (site-wide)

### Button system
Rebuild `src/components/ui/button.tsx` variants + primitives so every state is token-driven:

| State | Primary CTA (emerald) | Secondary (champagne outline) | Ghost |
|---|---|---|---|
| Default | emerald fill, **cream text** | champagne border, cream text | cream text |
| Hover | emerald ombre lift + gold ring | champagne fill, ink text | pearl bg |
| Active/Selected | inner emerald + gold underline | inverted (gold fill, emerald ink) | emerald text + underline |
| Focus | 2px champagne focus-visible ring | same | same |
| Disabled | 40% opacity, no shadow, cursor-not-allowed | same | same |
| Loading | spinner + label muted, click blocked | same | same |

Fix specifically: **service-selector buttons currently render black text on emerald** — force `text-cream` via variant, not inline. Add Storybook-style regression via existing Playwright contrast scripts.

### Header rebuild
`src/components/PublicHeader.tsx`: 72px lockup with monogram (32px) + wordmark, 24px right gutter, 1px champagne hairline, sticky-shrink to 56px on scroll. Nav links use Cormorant small-caps at 13/0.28em. Right cluster: Search icon, Language, Login, primary "Create free account" CTA.

### Contact / phone input
Replace every phone input with `react-phone-number-input` (already installed) wrapped in a `JbjPhoneField` primitive: flag dropdown, country search, ISO code, `formatIncompletePhoneNumber` live formatting, `isValidPhoneNumber` validation with Zod schema. UAE default, E.164 output stored.

### Visual QA sweep
Run existing `scripts/contrast/*` + Playwright at 5 breakpoints on every public route; fix spacing/contrast regressions as a punch list.

---

## 2. SaaS auth flow

Replace the current "sign-up gate on every visit" with a real SaaS pattern using Lovable Cloud Auth (email/password + Google).

**Session logic** (`src/contexts/AuthContext.tsx`):
- Register `onAuthStateChange` at app boot; hydrate session from cookies.
- Public routes render immediately. No forced gate.
- Session persists via Supabase's default (local storage refresh token, ~1 year rolling).
- Add `getUser()` re-validation on any premium action.

**Routes**:
- `/` — landing (public, rich).
- `/auth` — combined Sign in / Create account, tabbed, with Google button + email/password. Preserves `?next=` param.
- `/reset-password` — new page for recovery flow.
- Remove the auto-redirect to `/signup` that currently blocks returning users.

**Google auth**: use `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` (managed OAuth, no keys needed).

---

## 3. Premium content gating

Introduce a `<PremiumGate>` HOC + `useRequireAuth()` hook. Behavior:

- **Anonymous** clicking a gated action → smooth modal: "Create your free account in 30 seconds to unlock [feature name]" with `?next=` deep-link back to the exact card/action.
- **Authenticated** → navigate straight through, no interruption.

**Gated triggers** (config in `src/config/premiumActions.ts`):
- Property: `View Property`, `View Details`, `Download Brochure`, `Register Interest`
- Content: `Read Guide`, `Download PDF`, `View Market Report`, `View Area Guide`
- Tools: `AI Home Finder`, `Property Measurement`, `Interior Design AI`, `Matchmaking`, `Reports`
- Dashboard / CRM entrypoints

**Soft-gate teasers**: property/insight cards show title, image, 2-line preview, blurred price/details with a "Unlock" pill — better SEO + conversion than hard-blocking pages.

---

## 4. Premium homepage (public landing)

Rebuild `src/pages/Index.tsx` (or the current `/` route) as a scroll-narrative. All content driven by typed configs in `src/content/home/*.ts` so Batch B can wire real CMS.

Sections, in order:

1. **Hero** — one-line headline, sub, primary CTA "Create your free account", secondary "Talk to an advisor". Muted 20s video loop, champagne motes.
2. **Featured Properties carousel** — horizontal snap-scroll, 6-8 curated cards. Filter chips: `Featured · Outstanding · Trending · Recently Launched · Luxury · Investment`. Soft-gate on click.
3. **Market Insights** — 3-column grid pulling from Insights taxonomy: Dubai Market Reports, Area Guides, Investment/Buying/Selling/Golden Visa/Tax/Rental/Off-plan Guides. "Explore Knowledge Hub →" CTA.
4. **The Library** — premium hero card with categories: JBJ Guides, Investment Playbooks, Market Research, White Papers, Educational PDFs, DLD Resources, Government Docs, Training Manuals. Scaffolded titles with a single sample PDF; owner upload UI ships in Batch B.
5. **AI Toolkit strip** — 4-card row (Home Finder, Measurement, Interior Design, Matchmaking) — soft-gated.
6. **Awards & Recognition** — logo wall (partners, developers, media) + achievement pills.
7. **Why Choose JBJ** — 6-tile value grid (Verified inventory, RERA-certified, AI-native, End-to-end journey, Global buyer network, Founder-led advisory).
8. **Success Stories** — 3-card carousel: case studies, transformations, investment results, testimonials.
9. **Conversion band** (see workstream 8).
10. **Footer** — already rebuilt.

New routes for the section landings (soft-gated content on the card, hard-gated full content):
`/insights`, `/insights/:slug`, `/library`, `/library/:slug`, `/awards`, `/success-stories`.

---

## 8. Conversion strategy

- Site-wide `<ConversionBand>` component appears above footer on every public page. Rotating headline copy: *"Create your free account in under 30 seconds"*, *"Unlock the complete JBJ platform — free"*, *"Join thousands of investors, brokers & developers"*.
- Sticky "Create free account" pill in header after 30% scroll on anonymous sessions.
- Soft-gate modals reuse the same conversion copy verbatim so messaging feels consistent.
- Add a lightweight analytics event stream (`auth_prompt_shown`, `auth_prompt_signup`, `soft_gate_unlock_click`) via a `useAnalytics()` hook writing to a `analytics_events` table for Batch B dashboards.

---

## Backend (Cloud) additions in Batch A

- Enable Lovable Cloud (if not already).
- `profiles` table (id → auth.users, full_name, phone_e164, country, user_type, avatar_url, created_at) with auto-create trigger.
- `user_roles` table + `has_role()` security-definer function (per project standard).
- `insights_articles`, `library_documents`, `success_stories`, `awards` tables — schema + RLS (anon SELECT where `published=true`, authenticated write via role). Content stays in typed configs for Batch A; tables ready for Batch B CMS.
- `analytics_events` table (append-only, service_role write).

All tables get explicit `GRANT` statements per project standard.

---

## Validation gates (must all pass before Batch A closes)

1. Playwright screenshot QA at 390/768/1024/1440/1920 across `/`, `/auth`, `/insights`, `/library`, `/awards`.
2. Contrast + button-state audit (`scripts/contrast/*`) reports 0 regressions and 0 black-on-emerald hits.
3. E2E: anonymous → click "View Property" → auth modal → sign up → land on the same property.
4. E2E: returning user with valid session → land on `/` with no gate, header shows account menu.
5. Google sign-in end-to-end.

---

## Batch B — Monetization (queued, next round)

Not built in Batch A. Locked scope:

- **Stripe (built-in seamless)** — enable with `payments--enable_stripe_payments` after Batch A ships. Full-compliance handling (managed_payments) since UAE seller + global digital buyers.
- **Investor Memberships** (subscriptions): Starter Consultation (one-off 30min), Professional (1hr), Executive (2hr), Founder Experience (recurring). AED pricing benchmarked against Property Finder Pro, Bayut Elite, DAMAC Sky, PropertyClub before proposal.
- **Broker Academy**: 1 / 5 / 10 / 20 session bundles, in-video curriculum (Dubai market, RERA, DLD, sales, off-plan, CRM, AI tools, prospecting), Certificate of Completion + interview funnel.
- **Agency Packages**: 20 / 50 / 100 / Enterprise user tiers bundling CRM + AI + Matchmaker + Training Portal + Library + Reporting + Automations.
- Owner CMS for Insights/Library/Success Stories, real PDF uploads via Storage bucket.
- Consultation booking calendar + Zoom/Meet integration.
- Enterprise "Contact sales" pipeline into CRM.

---

## Estimated build order for Batch A

1. Button variants + service-selector fix (blocks visual QA)
2. Header + phone rebuild
3. Auth context + `/auth` route + session persistence
4. `<PremiumGate>` + soft-gate cards + config
5. Homepage sections 1-5
6. Homepage sections 6-9 + Conversion band
7. Cloud tables + RLS
8. Playwright validation pass + fixes

Ready to switch to build mode and start with step 1?
