## Part 1 — Apply Buttons (public Careers page)

Fix all "Apply" CTAs on the position cards (the 6 default cards AND every additional card revealed by "View all N positions") so they are unmistakably 3D, fully filled navy, white text.

**File:** `src/pages/JoinApplication.tsx` (line ~660)

- Replace the current outlined/transparent variant with a single solid style:
  - Background: `#102540` (navy)
  - Hover: `#1a3d63`
  - Text + icon: white
  - 1px gold hairline (`#B89555`), `rounded-lg`, soft drop shadow + inner top highlight for 3D feel (`shadow-[0_4px_10px_-2px_rgba(16,37,64,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]`)
  - Active press: `translate-y-[1px]` and reduced shadow
- "Selected" state: same navy fill + white check + label "Selected" (still high contrast, no white-on-light regressions). Tag with `data-allow-dark-cta` + `data-no-contrast-guard` so the global black-CTA guard leaves it alone.
- Applies automatically to every card (live DB list AND the "View all 21 positions" expansion) since they share this one render block.

No other field, label, or copy on `/careers` changes.

---

## Part 2 — Careers Portal (owner back-end consolidation)

Build **one** owner-only hub at `/owner/careers-portal` that becomes the single home for every HR / employee / payroll / hiring surface. Today these are scattered across 8+ separate routes; we wire them all in as **sections** first, then retire the standalone routes via redirects (no feature deletion).

### 2a. New route + shell

- New page: `src/pages/owner/CareersPortal.tsx` (guarded by `OwnerGuard`).
- New route: `/owner/careers-portal` in `src/routes/AdminRoutes.tsx`.
- Layout = fixed 88px global header + a **second sub-header** (sticky, champagne band, gold hairline) listing every section as tabs/pills. Sub-header sections (initial set, derived from the audit):
  1. **Overview** — KPIs (open positions, applications this week, headcount, payroll due)
  2. **Open Positions** — list + create/edit/remove (see 2c)
  3. **Applications & CVs** — embeds existing `HRDashboard` CV-Center tab
  4. **Candidates & Interviews** — embeds `hr_candidates`, `hr_interview_assessments` views
  5. **Hiring Pipeline / Job Offers** — embeds `JobOfferTemplate` + offer workflow
  6. **Employees** — embeds `EmployeeManagementHub` (roster, journey, activity audit)
  7. **Onboarding** — embeds `AdminOnboarding` + `hr_employee_onboarding`
  8. **Payroll & Salaries** — embeds `employee_salaries`, `employee_commissions`, `employee_payment_history`, `employee_earnings_summary` (uses existing salary access audit)
  9. **Performance & Warnings** — `employee_performance_summary`, warning/disciplinary records
  10. **Employee Comms** — `EmployeeChatPage`, `employee_emails`, `employee_notifications`
  11. **HR Agent / AI** — embeds `HRAgent`
  12. **Audit & Access Logs** — `hr_access_logs`, `hr_audit_logs`, `employee_salary_access_audit`

Section selection driven by `?section=` query param so deep-links survive.

### 2b. Section embedding strategy (NO feature deletion)

Each existing page is refactored into a presentational component (mirroring the existing `EmbeddedHRDashboard`, `EmbeddedEmployeeHub`, `EmbeddedITDepartment` pattern already in `src/components/admin/`). The portal renders these inline. Standalone pages are kept on disk one release, then their routes become `<Navigate to="/owner/careers-portal?section=…" replace />`:

| Old route                                  | Section param                                |
| ------------------------------------------ | -------------------------------------------- |
| `/hr-dashboard`                            | `?section=applications`                      |
| `/employee-management`, `/it-department`   | `?section=employees`                         |
| `/employee-hub`                            | `?section=employees&view=hub`                |
| `/employee-chat`                           | `?section=comms`                             |
| `/hr-agent`                                | `?section=hr-agent`                          |
| `/owner/job-offer-template`                | `?section=offers`                            |
| `/admin/onboarding`                        | `?section=onboarding`                        |
| `/admin/hr`, `/hr-hub`                     | redirect → portal                            |

Each redirect uses `replace` so back-button stays clean. We do NOT delete the page files in this iteration — only after the portal is verified working end-to-end (per the user's instruction "first add them all, then delete").

### 2c. Position management (new in portal)

In the **Open Positions** section, owner can:

- See full list of `open_positions` rows with status (open / closed / draft).
- **Add new position** dialog — fields: title, department, location, employment type, seniority, salary band, status. On title entry, a **"Generate with AI"** button calls a new edge function `generate-job-description` (model `google/gemini-2.5-pro` via Lovable AI Gateway) which fills: summary, responsibilities, requirements, benefits, ideal-candidate profile, SEO blurb.
- **Edit position** — same dialog prefilled. Two AI affordances:
  - **Regenerate** — recompose the full JD.
  - **Edit with AI** — free-text prompt ("make it more senior", "add Arabic-language requirement", "shorten responsibilities") sent with current JD; AI returns edited JD; owner previews diff → Apply.
- **Manual edit** — rich-text editor (existing sanitized editor) always available; AI is optional, never forced.
- **Remove position** — soft-delete (sets `status='archived'`, hides from public Careers page but keeps history for audit).
- All writes go through Supabase with RLS scoped to owner. Audit row written to `admin_edit_log` per the Owner Provenance standard.

Public Careers page (`/careers`) already reads from `open_positions`, so changes appear live with no further wiring.

### 2d. Audit & cleanup pass

Before shipping, run a repo-wide grep for direct links/buttons pointing at the old standalone HR/employee routes and re-point them to the portal section params. Owner sidebar (`OwnerSidebarNav.tsx`) gets a single **"Careers Portal"** entry replacing the current scattered HR/Employees items (old items stay during transition then are removed in the same PR that flips the redirects).

---

## Technical Notes

- **Tables already present (no migration needed for embedding):** `open_positions`, `hr_cv_submissions`, `hr_applications`, `hr_candidates`, `hr_interview_assessments`, `hr_employees`, `hr_employee_onboarding`, `hr_audit_logs`, `hr_access_logs`, `employee_salaries`, `employee_commissions`, `employee_payment_history`, `employee_performance_summary`, `employee_chat_messages`, `employee_emails`, `employee_notifications`, `employee_activity_audit`, `employee_salary_access_audit`.
- **Possibly needed (will confirm during build):** add `status` enum + `archived_at` columns to `open_positions` if not present; add `ai_generated`, `ai_last_prompt` provenance columns.
- **Edge function (new):** `supabase/functions/generate-job-description/index.ts` — Lovable AI Gateway, `requireOwnerAuth`, returns structured JD JSON. No external API key required.
- **Design tokens:** Portal sub-header uses existing champagne band tokens, navy `#102540` tabs, gold `#B89555` hairline — fully compliant with Champagne-Gold standard and Black-CTA→Navy global rule.
- **No removal in this PR:** standalone HR/Employee page files remain on disk; only routes redirect. Deletion is a follow-up after portal QA passes.

---

## Out of Scope

- No changes to the public `/careers` form fields, labels, search bar, phone input, or any non-Apply visuals.
- No changes to CRM relationship sub-tabs (Employees view under `/owner/crm` continues to exist and links into the portal).
- No new auth flows; portal inherits `OwnerGuard`.
