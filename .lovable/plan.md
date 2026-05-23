
## 1. Remove "Partners" section from vertical sidebar

In `src/components/navigation/GlobalVerticalNav.tsx`:

- Delete the `PARTNERS` section entries (lines ~195-200): Partners Hub, Mortgage Partner, Legal Partner, Company Setup Partner, Visa Services.
- Add `Visa Services` (`/partners/visa-services`) into the `SERVICES` block alongside the existing Company Setup, Law Firm, etc. (Keep the underlying `/partners/*` routes alive so nothing 404s; only the sidebar entry moves.)
- Remove `'partners'` from the `MegaMenuKey` union, from `MEGA_MENU_GROUPS.partners`, and from `MEGA_MENU_TITLES.partners`.
- Audit and remove any "Partners" group label / divider rendering tied to the deleted section.

No changes to `MegaMenuPartners` component or `/partners/*` pages themselves — they remain reachable via the header mega menu and direct URLs.

## 2. Post-registration Partner CTA on hero

Only for users who have registered as a partner (any row in the partner-registration tables), render a slim CTA band directly under the hero on the home page:

> "Get verified — open your Partner Portal" → links to `/partners` (or the specific partner type dashboard if known).

- Add a small `PartnerVerifyHeroCTA` component, gated by a `usePartnerRegistration()` hook that checks the current user against existing partner tables (mortgage / legal / company-setup / visa). If none → render nothing.
- Mount it under the existing Hero in `src/pages/Index.tsx` (or wherever the home hero lives), above the next section.

## 3. Merge Broker Education + Broker Training into one page

Keep `JBJ Academy` as its own page (untouched). Merge only `BrokerEducation` (`/broker-education`, 530 lines, public) and `BrokerTraining` (`/broker/training`, 370 lines, auth+broker-gated).

- New canonical page: `src/pages/broker/BrokerLearning.tsx` at route `/broker/learning`.
- Layout: premium champagne-gold tabbed page following design system (Inter, IconTile, no gold fills, ink #1A1A1A on champagne):
  - Hero header with page title + brief intro.
  - Segmented tab control: **Library** (everything currently in `BrokerEducation` — books, collections, modals) and **Training** (everything in `BrokerTraining` — courses, certification, progress).
  - The `Training` tab is rendered behind an in-page `AuthRequiredRoute` + `broker` mode check so the public can still browse Library without login; clicking Training prompts login via ActionGate when needed (keeps existing gate behavior, just inlined).
- Move all sub-components in `src/components/broker-education/*` as-is; no UI/feature removal (per the No-Removal policy).
- Routing:
  - Add `/broker/learning` route in `src/routes/PublicRoutes.tsx`.
  - 301-style redirects: `/broker-education` → `/broker/learning?tab=library`, `/broker/training` → `/broker/learning?tab=training`.
- Update every internal link to the new URL:
  - `src/config/mainLayoutRoutes.ts`, `src/config/globalSearchIndex.ts`
  - `src/components/Footer.tsx`, `src/components/GlobalHeader.tsx`, `src/components/header/MegaMenuBrokerHub.tsx`, `src/components/header/MegaMenuMore.tsx`, `src/components/header/MegaMenuInsights.tsx`
  - `src/components/navigation/GlobalVerticalNav.tsx`
  - `src/components/dashboard/QuickActions.tsx`, `src/components/guides/GuideNavigation.tsx`, `src/components/home/DeveloperPortalCTA.tsx`
  - `src/pages/BrokerHub.tsx`, `src/pages/BrokerPortal.tsx`, `src/pages/BrokerDashboard.tsx`, `src/pages/BrokerPartnerDashboard.tsx`, `src/pages/BrokerFAQ.tsx`, `src/pages/EducationHub.tsx`, `src/pages/AcademyGraduates.tsx`, `src/pages/JBJAcademy.tsx`, `src/pages/owner/OwnerAuditPage.tsx`, `src/pages/Sitemap.tsx`, `src/pages/VerifyCertificate.tsx`
  - `src/hooks/useBrokerEducation.ts` (any hard-coded paths)
- SEO:
  - One `<title>` ≤60 chars, meta description ≤160 chars, single H1, canonical `/broker/learning`, JSON-LD `Course`/`EducationalOrganization`.
  - Update `public/sitemap.xml` + `scripts/generate-sitemap.ts`: remove `/broker-education` and `/broker/training`, add `/broker/learning`.
  - Mark related SEO findings fixed after change.
- Delete (or stub-redirect) the two old page files once all imports point to the new module.

## 4. Mirror header Account shortcuts under sidebar "My Account"

Source of truth: `src/components/header/MegaMenuAccount.tsx` (rendered when user opens the profile dropdown in the horizontal header).

- Extract the canonical account-shortcut list from `MegaMenuAccount.tsx` into a single shared module: `src/config/accountShortcuts.ts` (label, icon, href, optional role gate).
- Refactor both `MegaMenuAccount.tsx` and the `account` mega-menu group in `GlobalVerticalNav.tsx` (lines ~503-511) to render from this shared config so they stay in lockstep — header dropdown and sidebar "My Account" expose the exact same shortcuts in the same order.
- "My Dashboard" stays the primary entry and continues to deep-link into the main dashboard (already wired).

## Technical details

- Files created: `src/pages/broker/BrokerLearning.tsx`, `src/components/home/PartnerVerifyHeroCTA.tsx`, `src/hooks/usePartnerRegistration.ts`, `src/config/accountShortcuts.ts`.
- Files edited (high level): `GlobalVerticalNav.tsx`, `MegaMenuAccount.tsx`, `PublicRoutes.tsx`, `Footer.tsx`, `GlobalHeader.tsx`, broker mega-menu + dashboard links listed above, `sitemap.xml`, `generate-sitemap.ts`, `Index.tsx`.
- Files removed (after link sweep): `src/pages/BrokerEducation.tsx`, `src/pages/broker/BrokerTraining.tsx` — replaced by redirects to `/broker/learning`.
- DB: none. No schema changes.
- Strictly UI/navigation/routing changes; no business-logic edits.
- Follows the No-Removal Policy: every existing feature from both pages is preserved inside the new tabbed page; old URLs redirect, never 404.
- Verification: `npm run build` (auto), spot-check the four flows — sidebar has no Partners, Services lists Visa Services, `/broker-education` and `/broker/training` redirect to the merged page with the right tab pre-selected, header dropdown + sidebar My Account render the same list.
