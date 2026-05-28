
# Unified HR Pipeline (Applicant → Signed Broker → Employee → Academy)

## Goal

One end-to-end workflow with no duplicate paths. The applicant logs in once, fills a single in-app intake form, and that one record drives the job offer, the e-signature, the employees hub, the academy, and the certificate — all kept in sync. Nothing existing is deleted; legacy tables become read-only mirrors of the canonical record.

## Canonical record

`hr_candidates` becomes the single source of truth for a person moving through hiring. Every other table that today holds an applicant (`hr_applications`, `hr_cv_submissions`, `hr_job_applicants`, `new_joiner_applications`) gets a nullable `candidate_id` FK back to it. A DB function `upsert_candidate_from_legacy(...)` reconciles existing rows on first read so we never lose history.

New canonical status enum on `hr_candidates.status`:

```text
new → reviewing → approved_pending_docs → docs_submitted →
offer_drafted → offer_pending_owner_approval → offer_sent →
offer_signed → employee_active → (academy_in_progress →
academy_completed → certificate_eligible → certified)
```

Plus terminal: `rejected`, `withdrawn`.

## Flow

```text
┌──────────────┐   Approve & Request Docs   ┌──────────────────────┐
│ Applicants   │ ─────────────────────────► │ Intake (in-app)      │
│ tab (owner)  │                            │ /careers/intake/:tok │
└──────┬───────┘                            └──────────┬───────────┘
       │                                               │ signup or
       │                                               │ login required
       │                                               ▼
       │                                    ┌──────────────────────┐
       │                                    │ Candidate uploads:   │
       │                                    │ photo, Emirates ID,  │
       │                                    │ passport(s), RERA,   │
       │                                    │ languages, nat.,     │
       │                                    │ experience, etc.     │
       │                                    └──────────┬───────────┘
       │                                               │ submit
       │                                               ▼
       │                              status = docs_submitted
       │                              + auto-draft job offer
       │                                               │
       ▼                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Owner: Offer card pre-filled (name, email, phone, all KYC)       │
│ Click "Approve & Send for Signature"                             │
│  → uses internal e-sign (PublicSignDocument + envelopes)         │
└──────────┬───────────────────────────────────────────────────────┘
           │ envelope completed webhook
           ▼
status = offer_signed; signed PDF filed under broker;
candidate auto-enrolled into hr_employees + employees_hub;
academy access flag flipped on.
```

## Database (one migration)

1. Add `candidate_id uuid` to: `hr_applications`, `hr_cv_submissions`, `hr_job_applicants`, `new_joiner_applications`. Backfill via match on `(lower(email), phone_e164)`.
2. Extend `hr_candidates`:
   - `intake_token text unique`, `intake_token_expires_at timestamptz`
   - `intake_submitted_at`, `intake_payload jsonb` (photo_url, emirates_id_url, emirates_id_number, passports jsonb[], rera_card_url, rera_number, languages text[], nationalities text[], current_company, total_years_experience, dob, gender)
   - `current_job_offer_id uuid`, `current_envelope_id uuid`, `employee_id uuid`
   - Tighten status enum (additive — old values kept).
3. Create view `vw_hr_candidate_360` that LEFT JOINs candidate → latest application / offer / envelope / employee / academy progress / certificate. Powers the applicant drawer and the Owner Pipeline board.
4. Trigger `trg_candidate_on_envelope_signed` on `signature_envelopes` UPDATE → when status='completed' and `metadata->>'candidate_id'` set, flip candidate to `offer_signed`, insert `hr_employees` row, copy intake data into the employee record, insert `broker_onboarding_progress` row, file signed PDF reference under `hr_certificates`/`employee documents` bucket.
5. Storage bucket `candidate-intake` (private, RLS: candidate-self or HR/owner). Reused for KYC documents — never world-readable.
6. RLS: candidate can read+update only their own row while token valid OR `auth.uid() = user_id`. HR/owner full access via `has_role(auth.uid(),'admin'|'owner'|'hr')`.

## Backend (edge functions, all `requireOwnerAuth` except intake)

- `hr-approve-and-request-docs` (owner) — sets status, mints `intake_token`, sends transactional email "Congratulations, your application has been approved…" with magic-link to `/careers/intake/:token`. Idempotent on `candidate_id+template`.
- `hr-intake-submit` (auth required, candidate self) — validates with zod, writes `intake_payload`, marks `docs_submitted`, auto-drafts a `hr_job_applicants` row from the candidate, calls existing job-offer composer, sets `current_job_offer_id`, updates `profiles` with photo + name + phone so the candidate's account is also complete.
- `hr-send-offer-for-signature` (owner) — wraps existing internal e-sign: creates `signature_envelopes` row with `metadata.candidate_id`, generates PDF via Document Studio composer, emails recipient the `PublicSignDocument` link.
- The existing envelope-completed webhook already runs — we just attach trigger #4 to it.

No new "send email" function — all email goes through the existing `send-transactional-email` with two new React Email templates: `candidate-docs-requested` and `candidate-offer-ready-to-sign`.

## Frontend (no duplicates)

- `src/components/crm/ApplicantProfileDrawer.tsx` — replace the current scattered action buttons with one ordered action strip driven by `vw_hr_candidate_360.status`:
  - new/reviewing → `Approve & Request Documents`
  - docs_submitted → `Review Documents` + `Draft Job Offer` (auto-jumps to offer pre-filled)
  - offer_drafted → `Open in Document Studio` then `Approve & Send for Signature`
  - offer_sent → `Resend link` / `View envelope`
  - offer_signed → `Open Employee Profile`
- `src/components/hr/JobOfferManager.tsx` — when opened from a candidate, pre-fill recipient name, email, phone, department, intake fields. Read-only banner: "Linked to candidate · status: …". Remove the duplicate manual recipient entry path when `candidate_id` is present.
- New page `src/pages/careers/CandidateIntake.tsx` at `/careers/intake/:token`:
  1. If not logged in → forced signup/login (token survives across auth) and links the new `auth.users` to `hr_candidates.user_id`.
  2. Single-page form (photo, Emirates ID + number, passports list, RERA optional, languages, nationalities, current company, total YOE).
  3. On submit → `hr-intake-submit` → success screen "We've received your documents. JBJ will be in touch shortly."
- `src/pages/EmployeeManagementHub.tsx` — Employees grid already reads `hr_employees`. Add the `Registration completed` chip (driven by `candidate_id` + `intake_payload not null`) and a "View intake" tab inside the employee drawer (photo, KYC docs, passports, languages, experience).
- Signed Job Offers section in CRM gets a real filter bar (name / date / department / language) backed by `vw_hr_candidate_360` so it stops being a static list.
- Academy/certificate eligibility chip on the employee drawer is wired to `hr_quiz_attempts` + `broker_onboarding_progress` already present; we add the "Eligible — Approve Certificate" action that flips `hr_certificates.is_approved`.

### Things deleted: none

Legacy components/pages keep working. We only redirect their primary CTAs through the canonical pipeline. The old applicant tables remain — they now mirror via `candidate_id`.

## E2E smoke test

`scripts/e2e/hr-pipeline.mjs` — runnable via `code--exec`. Uses service role key (sandbox env) and the public anon key to simulate both sides.

Steps walked and asserted:

1. Seed `hr_candidate` (status `new`, fake email `e2e+<ts>@jbj.local`).
2. Call `hr-approve-and-request-docs` → assert status `approved_pending_docs`, `intake_token` present, `email_send_log` row with template `candidate-docs-requested`.
3. Simulate candidate signup with the email, exchange `intake_token`, POST `hr-intake-submit` with fake doc URLs uploaded to `candidate-intake`. Assert status `docs_submitted`, `intake_payload` populated, `hr_job_applicants` row created, profile updated.
4. Call `hr-send-offer-for-signature` → assert `signature_envelopes` row created with `metadata.candidate_id`, status `offer_sent`.
5. Directly update envelope to `completed` (simulating signing) → assert trigger fired: candidate `offer_signed`, `hr_employees` row created, `broker_onboarding_progress` row, employee_id set on candidate.
6. Cleanup: delete employee, candidate, envelope, applicant, profile, storage objects, auth user.

Script prints a green check per step; exits non-zero on any assertion. No browser, no Playwright, runs in <15s. Re-runnable.

## Out of scope (explicit)

- No DocuSign path (internal e-sign only, per your choice).
- No changes to the AI chat applicant intake other than back-filling `candidate_id` so it joins the same pipeline.
- No automated certificate issuance — owner still clicks "Approve Certificate"; the eligibility flag is the only new automation.
- No new design tokens — uses existing champagne/gold + IconTile/PricePill primitives.
