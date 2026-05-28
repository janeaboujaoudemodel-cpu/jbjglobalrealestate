# Broker Portal & Owner CRM Restoration

Multiple distinct issues need scoping before I touch code. Here's the plan.

## Issues identified

1. **/broker/learning page is broken** — "Broker Learning" hero and "Market Intelligence Training" sub-page are rendering on top of each other (z-index / stacking / double-mount). Contrast is broken (faded title over dark hero).
2. **Owner is being routed into broker workspace** — When you (owner) click Dashboard, you see the *broker* CRM (`/broker/crm`) instead of your full owner backend. Owner should never land in the limited broker view.
3. **Broker sidebar** — Not pinned full-height to footer; shows owner-only "Secure Workspace / Assigned Databases" sections it shouldn't; missing "Add Lead" action.
4. **Broker Learning page** — Missing 3D certificate preview, guide books shelf, and onboarding modules. Access should only unlock after owner-issued onboarding code (existing email flow).
5. **Owner "Give Access" flow** — Needs a proper entry point: pick existing broker (search JBJ brokers / external sources / DnD) **or** register new broker → select permissions → trigger existing email+code+password flow.

## Plan

### A. Routing & role guard (owner vs broker)
- Add an `OwnerRedirectGuard` on every `/broker/*` route: if `has_role(owner)`, redirect to the owner equivalent (`/owner/crm`, `/owner/dashboard`, `/owner/learning`).
- Owner's top-nav "Dashboard" link → `/owner/dashboard`, never `/broker/*`.
- Keep `/broker/*` strictly for users with broker role + active access grant.

### B. Fix /broker/learning visual bug
- Investigate the page (likely two layout components mounted: `BrokerLearningHero` + `MarketIntelligenceTraining` both rendering hero band).
- Convert to a single layout: hero band on top, then Library/Training tabs, then module grid below. No overlap, no double title.
- Apply contrast tokens: hero title uses `text-[#1A1A1A]` on champagne band (per Champagne-Gold standard), no faded gold.
- Add the missing sections (only for brokers with access):
  - **Certification 3D card** (rotating cert preview component already exists in `src/components/learning/CertificatePreview3D.tsx` — wire it in)
  - **Guide Books shelf** (existing `BookShelf` component)
  - **Onboarding Modules** list (gated by `broker_access_grants.onboarding_completed`)

### C. Broker workspace sidebar
- Make `BrokerSidebar` `position: sticky; top: 88px; height: calc(100vh - 88px)` and remove footer overlap.
- Remove "Secure Workspace" + "Assigned Databases" sections (owner-only).
- Add "Add Lead" item that opens the same `AddLeadDialog` used in owner CRM (reuse, do not duplicate).
- Add "Import Database" item → CSV upload flow already in `src/components/crm/ImportLeadsDialog.tsx`.

### D. Owner "Manage Broker Access" hub
New route `/owner/crm/broker-access` (link from Owner CRM → Relationships → Brokers):
- Two primary actions: **View Brokers with Access** | **Grant New Access**
- Grant flow:
  1. Step 1: pick source — *Existing JBJ broker* / *External database broker* / *Register new broker*
  2. Step 2: searchable picker (reuse `UnifiedBrokerPicker`) OR new-broker form
  3. Step 3: permission matrix (My Leads / CRM Pipeline / Listings / Calendar / Tasks / Deals / Commissions / Documents / Forms / Academy / Marketing / AI Assistant) — checkboxes
  4. Confirm → calls existing `grant-broker-access` edge function → sends onboarding email with code (existing flow)
- "Brokers with access" tab: table of active grants, revoke/edit permissions, last-login, onboarding status.

### E. E2E verification
- Manually walk through: owner login → owner dashboard loads (not broker) → open Manage Access → grant a test broker → verify email → broker logs in with code → sees only their workspace (no Secure/Assigned sections) → can add lead → can open Learning with cert + books + modules.

## Technical notes
- Files to touch (estimated):
  - `src/App.tsx` (route guards)
  - `src/components/broker/BrokerSidebar.tsx`
  - `src/pages/broker/BrokerLearning.tsx` + `src/components/learning/*`
  - `src/pages/owner/crm/BrokerAccessHub.tsx` (new)
  - `src/components/owner/broker-access/GrantAccessWizard.tsx` (new)
  - Reuses: `AddLeadDialog`, `ImportLeadsDialog`, `UnifiedBrokerPicker`, `grant-broker-access` edge fn, `broker_access_grants` table.
- No DB migrations required — `broker_access_grants` and `broker_permissions` already exist.
- No new edge functions — onboarding email flow already wired.

## Out of scope (will not touch)
- Document Studio (separate active thread).
- Any owner-CRM business logic — only restoring routing so you land there.

Approve and I'll execute A→E in that order, verifying each step in preview before moving on.