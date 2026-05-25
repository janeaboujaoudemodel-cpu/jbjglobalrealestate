
I'll split this into 4 sequential batches. Each batch ships independently so you can QA before the next one starts. Tell me which batch to start with (or "all in order").

## Batch 1 — Public /join wizard + branding sweep (FAST, ~1 pass)
1. **Wizard step sync bug**: `ApplicationProgress` currently shows step 1 even when on step 5. Fix `activeStep` prop wiring in `JoinApplication.tsx` so clicking a pill jumps to that step, header reads "Step N of 5 — {label}", and progress % = max(validity, (activeStep+1)/5).
2. **Active vs inactive contrast**: active pill = solid navy `#102540` + white text/icon (force via inline style, bypass contrast guard). Inactive = cream `#F7F2EA` + ink `#1A1A1A` + visible champagne border. Completed = navy check tick (not faded gold).
3. **Brand sweep**: repo-wide replace `JBJ Global` → `JBJ GLOBAL REAL ESTATE` (job cards, footer, email templates, form labels, badges). Excludes code identifiers/URLs.
4. **Copy fix**: "Every section above reflects current JBJ operations — not a robot." → "Every section above reflects current JBJ Global Real Estate operations — not a roadmap."
5. **Fix runtime error**: `CareersPortal.tsx` fails to dynamically import — repair or stub the export so the route stops 500'ing.

## Batch 2 — Job lifecycle states (public + admin)
1. Extend `open_positions` with `status` enum: `open | urgent | paused | closed | hidden | featured` + `application_cap` + `applications_count`.
2. Public `/careers` card: when status ≠ open/urgent/featured, replace "Apply" with disabled "Applications Closed" pill. Show "Urgent Hiring" / "Featured" ribbons.
3. Owner Careers Portal → **Open Positions** tab: full CRUD with status dropdown, cap, featured toggle. (AI JD generation already in plan.md Part 2c — kept.)

## Batch 3 — Applications + CV + Status pipeline backend
1. **Applications Received** section in Careers Portal: list `hr_applications` (existing table) with filters (role, status, date, nationality, language, source). Drawer view + status changer.
2. **CVs Received** section: list `hr_cv_submissions`, in-platform PDF preview, download, link to applicant, "AI Summarize CV" button (Lovable AI Gateway, `google/gemini-2.5-flash`).
3. **Status enum** on `hr_applications`: `new | cv_received | pending_review | shortlisted | interview_scheduled | interview_completed | approved | rejected | kept_in_records | position_closed`. Status change writes `admin_edit_log` (Owner Provenance standard).
4. **Email templates**: seed 10 templates in existing `email_template_library` (category `careers`, audience `candidate`) — one per status. Status-change drawer has "Send templated email" with AI rewrite (uses existing `send-transactional-email` infra). NO new email system.
5. Hook public `/join` submit to write both `hr_applications` row + `hr_cv_submissions` row + uploaded CV to existing storage bucket, set status=`new`, fire `application-received` template.

## Batch 4 — Jessica candidate interview product (largest)
1. New public route `/careers/interview/:applicationId` (NOT `/hr-agent` which is owner-only).
2. UI: video-call shell with Jessica avatar (left), candidate camera tile (right, opt-in via `getUserMedia`), live transcript pane, text input + push-to-talk mic.
3. New edge function `careers-jessica-interview`: streams from Lovable AI Gateway (`google/gemini-2.5-pro`), system prompt loaded per-job (role, seniority, must-haves). Asks 6–10 role-specific questions, asks for CV if missing, scores 0–100, returns recommendation (`strong_yes | yes | maybe | no`).
4. New table `hr_interview_sessions`: `application_id`, `transcript jsonb`, `score`, `recommendation`, `summary`, `started_at`, `ended_at`, `consent_camera`, `consent_mic`. RLS: candidate sees own (by application token), owner sees all.
5. On finish: auto-update `hr_applications.status` → `interview_completed`, attach summary to applicant profile, notify owner inbox.
6. "Start Conversation" buttons on `/careers` and the Jessica panel route here (NOT `/hr-agent`).

## Out of scope (will refuse if mixed in)
- Building a second careers admin, second CV store, or second email provider — all wiring goes through existing `hr_*` tables, `email_template_library`, and `send-transactional-email`.
- Changing the global Champagne-Gold / Black-CTA-to-Navy standards.

---

**Please reply with one of:**
- `batch 1` / `batch 2` / `batch 3` / `batch 4`
- `all in order` (I'll ship 1 → 2 → 3 → 4 across separate turns, pausing for your QA between each)
- specific edits to the plan

I will NOT start coding Batch 4 (Jessica interview) before Batches 1–3 are merged, because Jessica writes into the `hr_applications` row created in Batch 3.
