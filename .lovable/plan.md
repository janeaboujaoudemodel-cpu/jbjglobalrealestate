# Mirror Brokerage Campaign Dashboard in Developer & Investor Portals

The Brokerage Portal has a polished layout: KPI insight tiles → Automations strip → tabbed section (`DLD daily additions | Emails sent + replies | Uploaded approval`) where the "Emails sent + replies" tab shows `BrandedEmailsLauncherCard` + `BrandedEmailDashboard`. The Developer Portal currently just drops the dashboard at the top with no tiles or tabs, and there is no Investor Portal shell.

## What to build

### 1. Developer Portal — mirror the brokerage layout
File: `src/pages/DeveloperPortal.tsx` (owner-mode header area, near lines 906–913).

Add — visible only when `isOwner` — an "Owner Campaign Dashboard" block above the developer intake form, structured the same as Brokerage Portal:

- **Insight tiles** (from `crm_relationship_email_log` + `email_send_log` filtered to `entity_type = 'developer_registry'`):
  - Total developers contacted
  - Emails sent
  - Opened
  - Responded
  - Registered (from `crm_developer_registry.registration_status`)
- **Tabs** using the same `bp-tabs` styling:
  - `Registration status` → developer status table (reuse existing `DeveloperContractsSection` / status counts)
  - `Emails sent + replies` (default) → `<BrandedEmailsLauncherCard variant="developer" />` + `<BrandedEmailDashboard kind="developers" />`
  - `Campaign activity` → recent inbound/outbound thread list scoped to developers

Keep the existing developer intake form below this block; non-owner developers see only the intake form (no change).

### 2. Investor Portal — new owner shell
There is no owner-facing Investor Portal today. Create `src/pages/owner/InvestorPortal.tsx` matching the Brokerage Portal shell (emerald header, insight tiles, `AutomationsStrip`, tabbed body).

- Extend `BrandedEmailDashboard` to accept a new kind: `investors` → `entity_type = 'investor'` with title "Investor campaign dashboard".
- Tabs:
  - `Investor pipeline` → list from `client_investors` / `investor_intake` with status chips
  - `Emails sent + replies` (default) → `<BrandedEmailsLauncherCard variant="investor" />` + `<BrandedEmailDashboard kind="investors" />`
  - `Campaign activity` → recent inbound/outbound scoped to investors
- Insight tiles: total investors, active pipeline, emails sent, opened, responded.

### 3. Wiring
- `BrandedEmailsLauncherCard`: add `"investor"` variant (copy = "Investor outreach", sender = `partnerships@jbj.ae`, template family = investor). Keep brokerage & developer variants untouched.
- `BrandedEmailDashboard`: add `investors` to the `Kind` union, `ENTITY_BY_KIND`, and `titleByKind`.
- Owner route: add `/owner/investors` → `InvestorPortal` in `src/routes/OwnerRoutes.tsx`, and a sidebar entry in the JBJ Hub shell alongside Brokerage & Developer portals.

## Out of scope
- No changes to the brokerage portal.
- No new email templates in this pass — investor variant reuses an existing generic outreach template until copy is finalized.
- No database schema changes (dashboard queries reuse `crm_relationship_email_log` + `email_send_log`).

## Clarification needed
For the Investor Portal, which data source should drive the pipeline tab and outreach recipients: `client_investors`, `investor_intake`, or both merged? I will default to `client_investors` as the primary and pull intake submissions as "leads" if you confirm.
