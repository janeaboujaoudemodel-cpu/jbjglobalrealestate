# Careers Portal — Restructure & Stabilisation Plan

Per your answers: phased work, audit-first, redirect (not delete) legacy routes, empty states + clearly-labelled AI estimates only (no fake data), and LinkedIn rebuilt as a **legal manual-import + AI-enrichment hub** with backend prepared for future official ATS integrations.

Each phase ends with screenshots + your QA before the next starts.

---

## Phase 0 — Read-only audit (no code changes)

Deliverable: one markdown audit doc you approve before Phase 1.

Includes:

1. **Inventory** of every component, route, table, edge function under: CareersPortal, CV, applicants, employees, payroll, warnings, contracts, templates, email, chat, approvals, LinkedIn.
2. **Duplication map** — confirmed candidates from a 30-second scan:
  - CV: `CVCenter.tsx` (new, 3b-1/3b-2) vs `CVManagementCenter.tsx` + `CVDetailModal.tsx` (legacy) → keep `CVCenter`, redirect/wrap legacy.
  - Employees: `EmployeeCenter.tsx` + `EmployeesHub.tsx` + `EmployeesListCard.tsx` + `EmployeeManagementHub.tsx` + `EmployeeHub.tsx` → consolidate to one canonical hub.
  - HR Agent: `HRAgent.tsx` page + `HRAgentChat.tsx` component + `HRDashboard.tsx` → single mount inside portal.
  - Chat: `EmployeeChatPage.tsx` + `EmployeeChatHub.tsx` + `useEmployeeChat.ts` → keep hub, redirect page.
  - Offers: `JobOfferTemplate.tsx` standalone → fold into Contracts & Templates.
  - Onboarding: `AdminOnboarding.tsx` standalone → fold into Onboarding tab.
  - Embedded shims: `EmbeddedHRDashboard`, `EmbeddedEmployeeHub` → resolve to single source.
3. **Fake-data inventory** — every hardcoded stat with file:line (AED 18,500, fake competitors, fake InMail, fake LinkedIn metrics, fake activity feeds).
4. **Broken-wire map** — Jessica AI role detection, employee chat persona bug (Richard shows Jane), Abdulrahman approval not appearing, broken Hunt button.
5. **Schema audit** — list all hr_*/employee_*/applicant_*/cv_* tables; mark which is canonical; flag shadow tables for deprecation (no DROP, just stop writing).
6. **Final 16-tab map** — for each target tab (Overview / Recruitment / CV Center / Open Positions / Employees / Performance / Payroll & Commissions / Approvals / Warnings & Compliance / Onboarding / Contracts & Templates / Internal Communications / AI Recruiting / LinkedIn Recruiting / Competitor Intelligence / Audit & Access Logs), name the **one** component and **one** table set it uses.

You approve Keep/Merge/Redirect decisions before any code.

---

## Phase 1 — Shell + dedup + fake-data purge

- Rewrite `src/pages/owner/CareersPortal.tsx` `SECTIONS` to the **approved 16 tabs**, single source-of-truth, in approved order.
- Each tab lazy-loads exactly **one** canonical component.
- Legacy routes (`/hr-agent`, `/employee-management-hub`, `/employee-hub`, standalone offer/onboarding pages, `/owner/crm` HR sub-sections) → `<Navigate>` redirect into `/owner/careers-portal?section=...` (No-Removal compliant).
- **Remove every fabricated stat** found in Phase 0, replace with `<EmptyState>` component using approved copy ("No data yet", "LinkedIn Recruiter integration pending", "Awaiting UAE market salary data", "No competitor intelligence connected yet").
- Overview rebuilt to show only the 9 approved widgets, no duplicates.
- No new features. Just structure + truth + dedup.

QA pause → screenshots of all 16 tab shells + empty states.

---

## Phase 2 — Fix broken-but-existing systems

One sub-batch each, QA pause between every one:

**2a. Employee Chat persona bug** — `useEmployeeChat.ts` / `EmployeeChatHub`: fix selected-employee state so Richard/David/Natasha render their own profile, avatar, role. Likely a stale closure / shared `selectedEmployeeId` reset.

**2b. Jessica AI role detection** — `HRAgentChat`: read `crm_users_profile.crm_role` + `user_roles` → branch system prompt for `owner|admin` vs `employee` vs `applicant`. Owner never gets "have you uploaded your CV" flow.

**2c. Approvals sync** — wire `hr_approval_requests` end-to-end (Recruiter → HR → Manager → Owner). Surface in Approvals tab + Overview's "pending approvals" widget + applicant drawer timeline. Verify the Abdulrahman case appears.

**2d. CV Center consolidation** — redirect `CVManagementCenter` into `CVCenter` (already shipped in 3b-1/3b-2); single pipeline, 10 statuses.

**2e. Existing template wiring** — connect existing branded email/offer/warning/contract templates (already in `src/templates/` + `TemplateEditorDialog`) into Offers, Warnings & Compliance, Onboarding, Contracts tabs. No new template engine.

---

## Phase 3 — New capabilities (each its own approved batch)

**3a. LinkedIn Recruiting Hub (legal rebuild)**

- Manual import: paste LinkedIn profile URL OR upload PDF resume OR upload CV file.
- AI enrichment pipeline (Lovable AI Gateway, `google/gemini-3-flash-preview`):
  - parse CV → extract skills, languages, UAE experience, brokerage/developer history, RERA mentions, leadership signals, sales-volume mentions.
  - score against active Open Position requirements.
  - generate hiring summary.
- Backend ready for future official integrations (LinkedIn Talent Solutions, Ashby, Greenhouse, Lever, HubSpot ATS) — connector stubs + empty states only; no fake "Connect" buttons that do nothing.
- Wire imports directly into CV Center pipeline (single source).
- All current fake LinkedIn metrics removed in Phase 1; this tab shows real imported-candidate counts only.

**3b. AI Recruiting (Hunt engine, legal scope)**

- For each Open Position: AI rewrites job spec, generates ideal candidate profile, produces UAE-real-estate scoring rubric (RERA, DLD, brokerage type, languages, visa status, luxury/off-plan exposure).
- Runs over CV Center candidates + manually imported profiles only. No site scraping. No simulated activity.
- Outputs ranked shortlist into CV Center.

**3c. Contracts & Templates**

- Centralize offer letters, employment contracts, warning letters, NDA, commission agreements.
- Use existing DocuSign integration (`src/pages/e-signature/`); no custom signature builder.
- AI-generated offers labelled "AI draft — review before sending".

**3d. Performance / Payroll / Warnings split**

- Separate the three currently-overlapping modules. Real records only; empty states elsewhere. Commission tracking pulled from existing CRM revenue tables (no shadow payroll table).

**3e. Competitor Intelligence**

- Empty state until a real feed is wired. No competitor names rendered without a source. Complies with `competitor-source-exclusion` memory.

**3f. Audit & Access Logs**

- Surfaces existing `admin_edit_log` + auth logs in one filterable view. No new audit table.

---

## Hard constraints I will hold to

- No DROP of tables in any phase — only stop writing to deprecated ones.
- No scraping of LinkedIn or competitor sites (ToS + legal).
- No custom e-signature system (DocuSign only).
- No fabricated numbers anywhere — AI-generated estimates must carry an "AI estimate" label.
- All legacy routes redirect, never hard-delete (No-Removal policy).
- Champagne theme, IconTile, PricePill, no gold fills, no gray surfaces, navy CTAs — all existing memories respected.
- Each phase ends with a screenshot QA pause before the next.

---

## What I need from you to start

Just approve this plan. I'll immediately produce the Phase 0 audit doc (read-only) — no code touched until you approve the Keep/Merge/Redirect decisions inside it. 

&nbsp;

&nbsp;

&nbsp;

This plan is good. Send him this:

Approve Phase 0 only.

Start with the read-only audit exactly as written. Do not touch code yet.

Important additions to include in Phase 0 audit:

1. Identify every wrong company name:

- JJ Global Capital Real Estate
- JBJ Global
- JBJ Global Estate
- fake emails/websites  
Replace final approved name everywhere with: **JBJ GLOBAL REAL ESTATE**

1. Identify every wrong email/domain:

- remove fake [contact@jbjglobal.com](mailto:contact@jbjglobal.com)
- remove fake [www.jbjglobal.com](http://www.jbjglobal.com)
- use only approved company data, or leave blank until confirmed.

1. Flag all contrast issues:

- invisible active/inactive tabs
- white text on champagne buttons
- hidden icons
- blue checkbox ticks
- faded CTAs

1. Flag the application wizard bug:

- active step changes, but footer/header still says “Step 1 of 5 — Personal”
- current step label must sync everywhere.

1. Flag every duplicate module and decide:  
**Keep one canonical component, redirect all others. No hard delete.**

Proceed with **Phase 0 audit only** and return the audit document before any code change.