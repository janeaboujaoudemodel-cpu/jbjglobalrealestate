# Careers Portal — Full Restructure Plan

This work is too large for one batch. Below is a sequenced plan. Each phase ends with screenshots + your QA before the next starts. Nothing fake. Nothing duplicated. Everything wired into existing systems.

---

## Phase 0 — Audit (READ-ONLY, no code changes)

Before deleting or building anything, I produce a written audit you approve:

1. **Inventory existing systems** — every table, edge function, component, route related to: CVs, applicants, employees, payroll, warnings, contracts, templates, email, chat, approvals, LinkedIn, DocuSign.
2. **Duplication map** — which modules duplicate which (e.g. two CV pipelines, two offer systems, two payroll tables).
3. **Fake-data inventory** — every hardcoded stat (AED 18,500, fake competitors, fake LinkedIn counts, fake InMail, etc.) with file + line.
4. **Broken-wire map** — Jessica AI role detection, employee chat persona bug, approvals not syncing Abdulrahman, etc.
5. **Reuse decisions** — for each of the 16 target tabs, which existing module is the canonical one and which get deleted/redirected.

Deliverable: a single markdown audit document. You approve the "keep / merge / delete" decisions before Phase 1.

---

## Phase 1 — Shell + Deduplication

- Collapse Careers Portal to the 16 approved top-level tabs.
- Redirect/delete duplicate routes (no orphaned pages, all links preserved per No-Removal policy → redirected, not deleted).
- Remove every piece of fabricated data identified in Phase 0; replace with luxury empty states ("No data yet", "Connect LinkedIn", "Awaiting synchronization").
- No new features yet. Just structure + truth.

---

## Phase 2 — Fix the broken-but-existing systems

In this order, one sub-batch at a time with QA pause between each:

1. **Employee Chat persona bug** (selecting Richard shows Jane) — fix state/routing.
2. **Jessica AI role detection** — owner never gets applicant flow; route by `crm_role`.
3. **Approvals sync** — multi-stage flow (Recruiter → HR → Manager → Owner) wired to `hr_approval_requests`; Abdulrahman case verified.
4. **CV Center consolidation** — single pipeline, 10 statuses already shipped in 3b-1.
5. **Templates wiring** — connect existing branded email / offer / warning / contract templates into Offer + Warnings + Onboarding tabs (no new template engine).

---

## Phase 3 — New capabilities (only after Phase 2 is stable)

Each is its own batch, scoped + approved separately:

- **LinkedIn Recruiter integration** — requires real OAuth credentials from you. I will NOT build fake "Connect LinkedIn" UI. We need to decide: official LinkedIn Recruiter API (requires partnership approval from LinkedIn), or a Connector (Ashby/HubSpot have ATS integrations).
- **AI Hunting engine** — Lovable AI Gateway, scoring rubric for UAE real estate roles (RERA, DLD, brokerage, languages, visa). Real candidates only; no scraping of competitor sites (legal risk + competitor-source-exclusion memory).
- **Competitor Intelligence** — real data sources only. If none connected → empty state. No fake brokerage names.
- **DocuSign contracts** — wire existing DocuSign integration (already in `src/pages/e-signature/`); no custom signature system.
- **Payroll + Benchmark** — real records only; benchmark tab shows "Not connected" until a market data source is wired.
- **Audit & Access Logs** — surface existing `admin_edit_log` + auth logs in one view.

---

## Decisions I need from you before Phase 0 starts

1. **LinkedIn**: do you have LinkedIn Recruiter API partnership access, or should I plan around the Ashby/HubSpot connector route? (Without one of these, "one-click LinkedIn hunting" is not legally/technically possible — I won't fake it.)
2. **Salary benchmark data source**: do you have a paid feed (Mercer, Hays, Cooper Fitch)? If not, that tab stays empty.
3. **Competitor intelligence data source**: same question — any real feed, or empty state until one exists?
4. **Scope of "delete duplicates"**: confirm I may redirect (not hard-delete) legacy routes like `/hr-agent`, `/owner/crm` HR sub-sections, standalone employee chat page, into the unified Careers Portal tabs.
5. **Timeline**: this is realistically 8–12 sub-batches over multiple sessions. Confirm you want this sequenced, not crammed.

---

## What I will NOT do (and why)

- **Will not** build any "scraper" for LinkedIn or competitor sites — violates LinkedIn ToS, competitor-source-exclusion memory, and exposes you to legal risk.
- **Will not** build a custom e-signature system — DocuSign already integrated, memory mandates it.
- **Will not** invent salary/benchmark/competitor numbers — your explicit instruction.
- **Will not** rebuild existing email/template/CV/employee/approval tables — your explicit instruction.
- **Will not** ship all 16 tabs in one batch — guaranteed to regress shipped work (3b-1, 3b-2).

---

Approve this plan (or tell me what to change) and answer the 5 decisions above. Then I start Phase 0 audit only — no code.