## Phase 1 — Fix the New Joiner form (immediate)

**Problem:** The three pickers in `NewJoinerApplicationForm` (`PhoneInputWithCountry`, `NationalitySelect`, `LanguageMultiSelect` from `src/components/ui/`) render every option flat inside the dialog because the Radix `<Select>` portal is mis-stacked inside `DialogContent`. We already have working canonical Popover+Command pickers at `src/components/crm/pickers/` (`PhoneInputWithCountry`, `NationalityPicker`, `LanguageMultiPicker`) used elsewhere in the CRM.

**Fix:**
1. Swap the three broken pickers in `NewJoinerApplicationForm.tsx` to the canonical `crm/pickers/*` ones (Popover-based, search-enabled, premium dropdown — matches Languages requirement).
2. Re-grid the dialog so Full Name + Email + Phone + Nationality sit on one consistent 2-col grid with equal field heights (`h-10`) and consistent label spacing.
3. Wrap Languages in the same premium dropdown (`LanguageMultiPicker`).
4. Verify dialog scroll + portal z-index; add `z-[60]` PopoverContent if needed.

## Phase 2 — One Universal CRM (admin / broker / employee), role-scoped

A single `/crm` shell rendered for every role. What changes is **what data the user sees**, not the UI.

**Data model additions (migration):**
- `crm_lead_assignments(lead_id, assigned_to_user_id, assigned_by, assigned_at)` — only assigned leads are visible to non-owners.
- `crm_database_assignments(database_id, assigned_to_user_id, scope: 'all' | 'selected', created_by)` + `crm_database_lead_assignments(database_id, lead_id, assigned_to_user_id)` — owner can upload a 40k-lead database under an employee's name then drip-assign in batches.
- `crm_shared_reports(report_id, owner_user_id, shared_with_user_id, scope)` — for the Share button.
- `crm_pipelines(id, owner_user_id, name, created_at)` + `crm_pipeline_items(pipeline_id, lead_id, status, expected_close_date, notes)` — each user builds their own pipeline by selecting leads from their assigned set.

**RLS (read):**
- Owner/admin: full.
- Employee: `lead.id IN crm_lead_assignments WHERE assigned_to = auth.uid()` OR `lead.id IN crm_database_lead_assignments WHERE assigned_to = auth.uid()`.

**RLS (write):**
- Employees can update status, notes, follow-ups, log calls/WhatsApp/email — **but cannot DELETE**. Only allowed status transition for "removing" a lead is `status = 'junk'`.
- DB trigger blocks `DELETE` for non-owner roles and rewrites attempted deletes into status updates client-side (UI hides delete buttons entirely for employees).

**UI parity (employee sees the same CRM as owner):**
- Leads table, Kanban, Add Lead, Calendar, Notes, Follow-up, Call, WhatsApp, Message, Email — all reused from existing CRM components, just filtered by RLS.
- Insights/analytics widgets render on the user's own assigned dataset.
- Share button (existing or new) → opens a picker of internal users to share a single lead / view / report.
- Excel export (uses existing `exportLeads.ts` / `exportXlsx.ts`).
- "Create Pipeline" → opens a multi-select over the employee's own leads, lets them set status + expected close + notes, then opens as a pipeline board. "Add more" inside the pipeline re-opens the lead picker over the employee's CRM.

## Phase 3 — Employee creation → account provisioning flow

**On submit of New Joiner form:**
1. Insert into `employees` (existing) with `job_title`, `department`, `crm_role`. Auto-categorise under the matching department / role section in the Employees view, Brokers view (when role implies broker), CRM "Employees" tab, and Org chart.
2. Show the new row in the Employees list with a **"Create CRM Account"** button next to the name.

**"Create CRM Account" action (owner-only):**
- Opens a confirmation modal: registered email + role + initial assignments (optional).
- Edge function `provision-employee-account`:
  - Creates auth user (admin API), generates a one-time login code (6-digit OTP) + magic link to `/employee-first-login`.
  - Inserts `user_roles` row with `crm_role` so RLS picks them up.
  - Sends the email via the transactional email pipeline (template: `employee-account-invite`).
- After sign-in, `/employee-first-login` forces `supabase.auth.updateUser({ password })` then routes to `/crm`.

**Test-first delivery (the "send to my email first" rule):**
- The provision modal has a toggle **"Send first invite to me (owner) as a test"**. When on, the OTP/magic-link email is sent to the user-memory test address (`infoo.jane@gmail.com`) instead of the employee. Owner logs in as the employee using that code to verify the empty-CRM experience.
- After owner clicks **"Approve & send to employee"**, the real invite goes out to the registered employee email. This toggle must appear on every account-creation modal — no exceptions.

## Phase 4 — "Give Access" actions on an employee row

Three buttons appear next to each employee once they have a CRM account:

1. **Assign Leads** → multi-select from owner's CRM, writes `crm_lead_assignments`.
2. **Assign / Upload Database** → drag-and-drop sheet upload OR pick an existing database. After upload it opens a viewer where owner selects which leads to push to the employee now (e.g. 100/day), writing `crm_database_lead_assignments`. Database stays under the employee's name regardless; only the visible subset grows.
3. **Share Report** → picks reports/views to share.

## Phase 5 — Wire-up & verification (no claim of "done" until all pass)

1. Open the New Joiner dialog, open each picker — confirm proper popover opens, search works, full list scrolls, selection persists, fields align.
2. Submit a test joiner → confirm row appears in Employees list, Brokers list (if broker role), CRM employees tab, org chart.
3. Click Create CRM Account with the test toggle ON → confirm email lands at `infoo.jane@gmail.com`.
4. Log in via that code → confirm `/crm` loads with the exact same UI as owner CRM but **zero leads**, no delete buttons anywhere, status menu only allows `→ junk` as the destructive option.
5. As owner, Assign 3 leads → re-login as employee → confirm exactly those 3 appear, insights recompute over them.
6. Upload a 200-row CSV under employee, drip 50 → confirm only 50 visible; drip another 50 → 100 visible.
7. Create a pipeline from 5 leads → confirm only those leads sit in the pipeline; "Add more" picker only shows the employee's own assigned set.
8. Attempt DELETE via devtools as employee → confirm RLS/trigger blocks it.
9. Share button → share one lead with owner → confirm owner sees it in shared inbox.
10. Excel export → confirm only employee's assigned leads are exported.

## Out of scope for this pass
- Re-theming existing CRM components (we reuse them as-is).
- Building new chart types for insights (we reuse the existing insight widgets).
- Mobile native employee app.

---

**This is large.** I'll do it in two approval gates:
- **Gate A:** Phase 1 form fix + Phase 2 migration + Phase 3 provisioning + test-mode email toggle.
- **Gate B:** Phase 4 assignment UI + pipelines + database drip + share + full Phase 5 verification.

Reply "approve gate A" to start, or tell me to merge both into one pass.