# Authentication, Contrast, Card Editing, and Full-Site Validation

## Objective
Repair the slow and fragmented sign-in journey, replace the accumulated contrast cascade with one semantic light/dark contract, move Drive controls into owner editing, correct card payment-plan presentation, and prove each stage visually before completion.

## Confirmed current state
- `/access` and `/auth` are separate routes. The gate still opens a password-only dialog, while `/auth` already contains recent-account, Google, Apple, email/password, OTP, and passkey logic.
- The desktop auth wrapper is capped at 28rem, producing the narrow layout shown in the screenshots.
- Auth recovery includes delayed retries, and `PublicAccess` contains recurring DOM style repaint work. These are confirmed sources of avoidable main-thread and redirect latency; real network timings will still be measured before changing retry behavior.
- `src/index.css` currently contains 11,033 `!important` declarations and many late, high-specificity `html body #root` rules. The cascade is not governed by one semantic surface contract.
- The visible Drive control is rendered directly by `ProjectCard`; the existing component already saves `google_drive_url` and invokes the Drive classification function.
- The project-card payment row is shared through `CardPricePaymentRow`, so the layout can be corrected once at the shared primitive.
- Existing profile-backed user data will remain in place.

## Stage 1 — Instrument the real delays
- Capture baseline traces for gate acceptance, email sign-in, existing-session restoration, Google initiation/callback, and the first protected-page render.
- Record request timing, React/console errors, popup transitions, auth-state transitions, and redirect counts.
- Identify the actual blocking request or timer for each flow; do not remove security validation or retries without proving they are redundant.

**Exit proof:** timing report plus screenshots of each starting and final state.

## Stage 2 — One branded authentication experience
- Route gate login, protected-route login, forgotten password, and recovery through the existing full `/auth` experience; retire the old password-only dialog from user-facing entry points.
- Widen and rebalance the desktop panel while preserving a responsive mobile layout.
- Present recent accounts first when available and retain only the locally remembered email identifier needed for account selection—never passwords or tokens.
- Keep email/password, Google, Apple, OTP/phone where already supported, and surface the existing passkey flow prominently for returning users. Preserve profile-backed display name, avatar, role, preferences, and passkey settings.
- Configure the managed Google provider in the same implementation stage. Use a public same-origin callback, preserve the intended destination separately, and redirect only after the authenticated session is hydrated.
- Remove duplicate overlay transitions, recurring style repaint loops, and unnecessary recovery waits proven by Stage 1. Keep a bounded recovery path for genuine stale sessions.
- Verify password recovery remains public and completes at the reset-password form.

**Branding boundary:** the in-app sign-in page will be fully JBJ branded. The external Google consent screen’s capitalization, logo, and application name require the matching Google OAuth brand configuration; verify the managed configuration and provide the exact console action only if Google still controls an uneditable portion.

**Exit proof:** desktop/mobile screenshots and measured timings for recent account, password, Google, recovery, logout/re-login, and passkey entry.

## Stage 3 — Replace the CSS conflict, not add another override
- Build a rendered-cascade inventory that records the winning selector and declaration for visible text, icons, controls, pseudo-elements, and form surfaces.
- Group conflicts by selector family, then delete obsolete “final/terminal/pass” blocks and runtime repaint code instead of appending another override.
- Establish one component-owned surface contract:
  - dark/emerald/ink surface → pure white foreground for text and icons;
  - white/champagne/mother-of-pearl/gold/light surface → ink/black foreground for text and icons.
- Make controls and reusable surfaces declare their semantic surface; inherit foreground through `currentColor` for icons. Preserve explicit status colors and imagery where color is not a foreground/background contrast role.
- Keep form input backgrounds owned by their components so global rules cannot blank them out.
- Preserve the locked emerald ombre, Cormorant Garamond headings, no-blue policy, and white/deeper-emerald hairlines on emerald surfaces.
- Add regression checks that fail on broad descendant repaint selectors, conflicting foreground assignments, black-on-dark, white-on-light, and newly introduced high-specificity global guards.

**Exit proof:** before/after winning-rule traces and screenshots for sidebar icons, menus, dialogs, tabs, cards, forms, FAQ states, and project CTAs.

## Stage 4 — Project card and Drive editing
- Remove the public/external Drive pill from project cards.
- Replace the circled owner edit affordance with an elegant standalone pen icon and an accessible label.
- Put the Drive URL field inside the owner-only project edit experience. Keep it connected to the listing record and invoke the existing classification/extraction pipeline after a valid URL is saved.
- Show extraction progress and success/failure inside the editor; do not expose the raw Drive link or claim extraction succeeded when classification failed.
- Review the equivalent developer detail control so public pages do not expose owner tooling.

**Exit proof:** anonymous, signed-in non-owner, and owner screenshots; save a Drive URL in a controlled test record and verify the extraction request/status path without destructive data changes.

## Stage 5 — Shared payment-plan card layout
- Repair `CardPricePaymentRow` spacing, alignment, truncation/wrapping, and stable height so price and payment-plan content remain balanced across project-card variants.
- Verify project, area, home handpicked, search/result, and imported-project cards at desktop and mobile widths.

**Exit proof:** element screenshots for short, long, missing, and multiline payment-plan values with no overlap or layout shift.

## Stage 6 — Full-site E2E visual validation in batches
Run canonical representatives first, then parameterized real records for each route family.

1. **Public:** home, properties/resale, project and developer details, areas, map, guides, tools, legal, contact, and card.
2. **Authentication and client:** access/auth/recovery/passkeys, protected redirects, client portal, dashboards, favorites, compare, and account/profile.
3. **Operational portals:** broker, developer, owner Hub, CRM, Bookings, Documents, Drive extraction, admin, and developer management.

For every route family at desktop and mobile:
- capture viewport screenshots plus element screenshots for interactive states;
- exercise hover, focus, open menus, tabs, sheets, dialogs, forms, empty/loading/error states, and owner edit states;
- assert no unexpected redirect, blank shell, horizontal overflow, duplicate popup, console error, failed application request, or contrast failure;
- record the exact winning CSS declaration for any failure and fix the selector family before rerunning the batch.

## Completion criteria
- Sign-in no longer detours through the legacy dialog and measured transitions have no unexplained wait or repeated click requirement.
- Returning users can use recent account, Google, or passkey entry; password recovery remains functional.
- No unresolved black-on-emerald/dark or white-on-light foreground failures in tested states.
- The conflicting global CSS families are removed or component-scoped; no new terminal override layer is added.
- Drive controls are owner-editor-only and a saved link enters the real extraction pipeline.
- Shared payment rows render correctly across all applicable card variants.
- A route-indexed screenshot and timing report covers the frontend and authenticated backend batches. The task remains open until all three batches pass or an external-provider limitation is explicitly evidenced.

## Technical notes
- Use Playwright with the managed authenticated session for protected routes and fresh contexts for signed-out flows.
- Combine rendered pixel checks with computed styles and stylesheet-rule tracing; automated accessibility tools alone do not detect icon and gradient failures reliably.
- Avoid database schema changes for this work. Existing user profiles and existing Drive/extraction fields remain authoritative.