
Scoped strictly to the JBJ Hub (`/owner/crm/jbj/*`). No changes to the legacy owner backend, the Relationships Hub composer, or any front-end site pages.

## 1. Launcher card (Developer / Broker / Owner portals)

File: `src/components/crm/BrandedEmailsLauncherCard.tsx`

- Remove the four mini-status chips ("AI drafts", "From contact@jbj.ae", "Test → Live locked", "Select all · include · exclude") from the launcher card. These belong inside the panel, not on the surface.
- Keep only: eyebrow, title, one-line blurb, and the CTA button. Rename primary CTA "Open campaigns" → "Send email" (per user).
- Fix "Registered" mislabel origin: the launcher stops rendering status; the developer card status logic is a separate concern (out of scope of this branded-emails task — user's demand about the developer card "Registered" labels will be flagged as a follow-up in section 6).

## 2. Branded Emails panel — merge redundant controls, restore Relationship-Hub feature parity

File: `src/components/crm/branded-emails/BrandedEmailsPanel.tsx` + `src/index.css` (PASS 175 block).

Layout & tabs
- 4 tabs stay: Template · Audience · Preview · Send. Fix contrast:
  - Active tab pill: emerald bg, pure white text AND white icon (`svg *`). Inactive: dark ink on ivory. Locked with `!` utility on the trigger and a `[data-state=active] svg { color:#fff !important }` rule.
  - "Select all (630)" active pill and "Custom (n)" pill: white text always; hover keeps emerald, not champagne/mint.

Template tab
- Deduplicate templates already handled by `normalizeTemplateKey`; add a second dedupe by `subject` to remove residual duplicates.
- Category rules:
  - Developer variant: only show templates in categories `Developer Registration`, `Developer Registration Follow-up`. Hide "Briefing follow-up" for developers.
  - Brokerage variant: show `Brokerage Breakfast Briefing`, `Brokerage Registration`, `Brokerage Registration Follow-up` (Briefing is priority/default selection).
- Seed / rename templates in the DB accordingly (migration in section 5).

Audience tab (restore Relationship-Hub UX)
- Show the full paginated recipient list (developers or brokerages) with:
  - Logo/avatar (developer `logo_url` via `DeveloperLogo`, brokerage initial fallback)
  - Name, meta (slug/emirate), email hint
  - Checkbox per row (tick/untick)
  - Sticky top bar: Select all / Clear / search input filtering the visible list live
  - Right rail shows count of selected + chip strip of first N with X to remove.
- Preserve include/exclude semantics: audience is a Set of included IDs; "Select all" fills the Set with all recipients; typing filters the visible list, not the Set.

Preview tab
- Preview reflects the **currently selected template** — bug today: it always shows Partnership Introduction because a fallback constant is used. Fix by binding the preview iframe/html to `selectedTemplate.body_html` with variables substituted.

Send tab — remove duplication
- Delete the standalone "Audience quick controls" block (Select all / Custom + search) that duplicates the Audience tab.
- Keep one compact recap row: Template · Audience count · From address. Inline mini-preview thumbnail on the right (small `iframe` scaled) so the user sees the template within the Send tab — not a separate section.
- Inputs:
  - "Send test to <email>" — text color forced black on white (`!text-[#0F1A16] !bg-white`), placeholder gray. Hover on the field must stay white/emerald outline, never mint/champagne.
  - Single primary action: "Send live to N recipients" (only one, not two). Include/Exclude dropdown attached to a small "Adjust audience" split control that opens the Audience tab in place.
- Remove the "Send live to 630 developers" second/duplicate button.

## 3. Hub Home (`/owner/crm/jbj`) polish

Files: `src/pages/owner/crm/HomeOverview.tsx` (or equivalent Home content), `src/pages/owner/crm/shell/crmShell.css`.

- "Distribute now" button: replace gold/yellow with emerald metallic + white ink (matches brand). Same call-to-action, new palette.
- "+" square button next to "All Open Tasks" (and any sibling plus buttons in Hub Home cards): make it a balanced square (`h-9 w-9`), emerald bg, white plus icon on both idle and hover states. Audit all Hub `Plus`-icon buttons and apply the same primitive.

## 4. Routing — no more legacy backend redirects

- Audit `src/routes/OwnerRoutes.tsx` and any redirect from `/owner` to old champagne surface. When an owner refreshes any Hub page, they must land on `/owner/crm/jbj/...`. Any `Navigate` sending owners to `/owner` root (legacy) is repointed to `/owner/crm/jbj`.
- Remove the "Preview last saved version" flash routing to the old backend if it still targets legacy paths.

## 5. Database migration (branded email templates)

Single migration:
- Insert / upsert (idempotent by name+category) the correct developer / brokerage templates:
  - `Developer · Registration`
  - `Developer · Registration Follow-up`
  - `Brokerage · Breakfast Briefing`
  - `Brokerage · Registration`
  - `Brokerage · Registration Follow-up`
- Soft-delete or unpublish stale "Briefing follow-up" / "Partnership Introduction" duplicates under the Developer category.

## 6. Explicitly deferred (called out to user, NOT changed in this plan)

- Developer card `Registered / Group not created` badge accuracy — needs a separate audit of `developers.registration_status` to identify the true handful (Shobha, MR, HRE, etc.) that are actually registered and clear the rest. I'll surface a separate plan for that so this task doesn't sprawl.

## 7. Validation (mandatory before claiming done)

Playwright, headless Chromium at 1280×1800:
1. Load `/owner/crm/jbj/owner-developers`, screenshot launcher card — chips gone, single CTA.
2. Click "Send email" → panel opens.
3. Cycle Template / Audience / Preview / Send — screenshot each. Verify: active-tab icons & text white; no duplicate audience controls in Send; template preview matches selected template; send-test input text is black-on-white.
4. In Audience tab: verify full list with logos + checkboxes, search filters live.
5. Load `/owner/crm/jbj` — screenshot Home: Distribute-now is emerald not gold, `+` next to All Open Tasks is square with white icon.
6. Refresh `/owner/crm/jbj/owner-developers` — verify no redirect to legacy `/owner`.

Attach all screenshots to the closing message; do not claim complete without them.

## Technical notes
- All contrast locks land in `src/index.css` `PASS 175 — Branded Emails` and a new small `PASS 176 — Hub Home Buttons`.
- No touching of `_shared/transactional-email-templates/` (those are outbound react-email templates, unrelated).
- No changes to legacy Relationships Hub composer — it already routes to the same `BrandedEmailsPanel` via the launcher.
