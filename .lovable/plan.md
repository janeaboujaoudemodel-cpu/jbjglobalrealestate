# Production Merge: Careers / CV Flow → Document Studio

Audit complete. There are 3 ingestion surfaces (public form, chat widget, manual upload), 2 tables (`hr_applications`, `hr_cv_submissions`), 2 buckets (`hr-documents`, `documents`), and **no CV template in the Studio yet**. The standalone `/toolkit/corporate-suite/cv-resume` builder is dead-routed. We will execute in 3 sequential phases.

---

## Phase 1 — Audit Report (delivered)

Findings (full report already on screen above). Headline gaps:
- Studio has **zero CV template** in `documentCatalog.ts` / `composers/index.ts`.
- No bridge from `CVCenter` → Studio (cannot open an applicant inside the editor).
- `hr_applications` and `hr_cv_submissions` only merged in UI; FK chain to `hr_job_offers` is broken for chat-widget applicants.
- AI scoring runs post-hoc from admin UI, not on insert.
- HR Inbox queries the wrong table for applicant pings.

---

## Phase 2 — Wire incoming CVs into the Studio

**A. Add the locked CV template to the Studio.**
- `src/config/documentCatalog.ts` — add one new entry:
  - `id: "candidate_cv"`, `audience: "staff"`, `category: "Recruiting"`, `label: "Candidate CV"`.
  - Fields: `candidateName`, `positionApplied`, `email`, `phoneE164`, `nationality`, `location`, `experienceYears`, `languages`, `skills`, `aiSummary`, `referenceCvUrl`.
- `src/templates/composers/index.ts` — add `composeCandidateCv(fields)` producing a one/two-page CV body wrapped in `[data-pdf-section]` blocks (Header / Summary / Experience / Skills / Languages / References) so the new section-aware exporter never splits a block.
- Uses the existing locked letterhead + footer (already standardized across all templates).

**B. Open-in-Studio bridge from CV Center.**
- `src/components/crm/CVCenter.tsx` + `ApplicantProfileDrawer.tsx` — add **"Open in Document Studio"** button on each applicant row that navigates to `/owner/careers-portal?section=contracts&tpl=candidate_cv&applicantId={id}`.
- `DocumentStudio.tsx` reads `applicantId` from search params, fetches the row from `hr_applications` (falling back to `hr_cv_submissions`), and pre-fills the new CV template fields. The existing session-persistence layer keeps draft state.

**C. Unified inbox correctness.**
- `src/components/hr/HRInboxTab.tsx` — switch the failing `owner_comm_threads` filter to `user_notifications WHERE type = 'cv_application'` so both intake surfaces appear.
- One small DB migration: add FK column `hr_cv_submissions.candidate_id → hr_candidates(id)` so job offers can later link to chat-widget applicants too. **GRANTs included in same migration.**

**D. AI scoring on insert (no more post-hoc).**
- Add a DB trigger on `hr_applications` + `hr_cv_submissions` inserts that invokes the existing `cv-ai-analyzer` edge function via `pg_net`, populating `ai_ranking`, `ai_summary`, `skills[]`, `languages[]`, `experience_years` before the owner opens the portal.

---

## Phase 3 — Public Careers form emits Studio-templated CVs

- `src/pages/JoinApplication.tsx` — after the row is inserted and the raw CV uploaded, call a new edge function `render-candidate-cv-studio` that:
  1. Runs `cv-ai-analyzer` synchronously.
  2. Calls `composeCandidateCv(fields)` server-side to build the locked HTML.
  3. Renders it to PDF using the existing chrome (`wrapWithJbjChrome`) and stores it at `hr-documents/{userId}/cv-studio-{ts}.pdf`.
  4. Writes the new path back as `hr_applications.studio_cv_url`.
- The CV Center then shows **both** the applicant's original upload and the Studio-rendered version (same chrome, same letterhead, same footer as all other JBJ docs).
- Kill the dead `/toolkit/corporate-suite/cv-resume` redirect: route it to `/owner/careers-portal?section=contracts&tpl=candidate_cv` so the single Studio template is the only CV builder in the codebase. `CVResumeBuilder.tsx` and its 3 dedicated AI edge functions (`cv-summary-generator`, `cv-experience-writer`, `cv-skills-suggest`) are removed.

---

## Files touched (summary)

**New:** `supabase/functions/render-candidate-cv-studio/index.ts`, one migration (FK + trigger + GRANTs).

**Edited:**
- `src/config/documentCatalog.ts`
- `src/templates/composers/index.ts`
- `src/components/document-studio/DocumentStudio.tsx` (applicantId prefill only)
- `src/components/crm/CVCenter.tsx`
- `src/components/crm/ApplicantProfileDrawer.tsx`
- `src/components/hr/HRInboxTab.tsx`
- `src/pages/JoinApplication.tsx`
- `src/routes/ToolkitRoutes.tsx` (redirect target)

**Deleted:**
- `src/components/corporate-suite/CVResumeBuilder.tsx` + `cvResumeExport.ts`
- 3 edge functions: `cv-summary-generator`, `cv-experience-writer`, `cv-skills-suggest`

---

## Out of scope

- Migrating historical `hr_cv_submissions` rows backwards into `hr_applications` (we keep both tables; the new FK + UI bridge makes them functionally one).
- Bucket RLS hardening — flagged in audit, not done here unless you want it bundled.
- DOCX re-render of the Studio CV (PDF only for now, matches every other template).

Reply **approve** to execute Phases 2 + 3 in order, or tell me which sub-step to drop/defer.
