## Goal

Give every field in `/careers` JoinApplication (and the parallel `CareersIntake` page) a single, consistent "required" visual language in gold, and enforce real required validation on each field — not just the basic 7-field guard that exists today.

## What changes (visual)

1. **Gold required indicator on every required label**
   - Replace the inconsistent `<span className="text-red-600">*</span>` (and missing asterisks) with a shared `<RequiredMark />` rendered as a `★` / `*` glyph in champagne-gold `#B89555`, with `aria-hidden` + visually-hidden "required" text for a11y.
   - Promote `.jbj-form-label` to always render the asterisk via a `data-required` attribute — so every required label across all JBJ forms gets the same gold mark.

2. **Gold focus + invalid ring on identity & preference fields**
   - Extend the existing `.careers-blue-field` / `.careers-gold-field` (and `.jbj-blue-field` / `.jbj-gold-field`) tokens in `src/styles/theme-tokens.css`:
     - `:focus-visible` → 2px gold ring `#B89555` + 1px navy border kept.
     - `[aria-invalid="true"]` → border flips to gold `#B89555` with a soft gold halo `0 0 0 3px rgba(184,149,85,0.22)` (no red — matches champagne system; red is reserved for destructive only).
   - Same treatment for `careers-phone-input` country trigger and `SearchableSelect` trigger via `triggerClassName`.

3. **Inline gold error message under each field**
   - New `<FieldError />` primitive: `text-[12px] font-medium text-[#B89555] flex items-center gap-1` with a tiny gold `AlertCircle` icon. Replaces today's toast-only feedback for per-field errors. Toast stays as the summary.

## What changes (validation)

4. **Zod schema for the full application** (`src/pages/JoinApplication.tsx`)
   - Single `applicationSchema` covering every visible field per step:
     - Step 0 Personal: firstName, lastName, phone (E.164 via libphonenumber check already imported), email (account-bound, so skipped from schema).
     - Step 1 Location & Language: nationality, preferredLanguage, country, city.
     - Step 2 Role & Experience: positionApplied **always required** (covers both DB-positions and fallback paths). Role-aware qualification blocks become required when visible:
       - `sales` → dealsClosed, totalDealValue, projectsSold, developerWorkedWith, reasonForLeaving, reference1{Name,Title,Email,Phone}, reference2{Name,Title,Email,Phone}.
       - `marketing` → marketingCampaigns, marketingBudget, marketingTools, portfolioLink (URL).
       - `hr_ops` → yearsExperience, systemsUsed, certifications.
       - `tech` → mirror existing fields in that block.
     - Step 3 CV: cvFile required (PDF/Word/image, ≤10 MB — existing rule).
     - Step 4 Consent: consentAccurate `=== true`, consentTerms `=== true`.
   - Mirror the same schema (smaller subset) in `CareersIntake.tsx`.

5. **Per-step gating + per-field errors**
   - Replace the current "Basic required-field guard" with `schema.safeParse(formData)` scoped to the current step.
   - Store `errors: Partial<Record<keyof FormData, string>>` in state. Pass `aria-invalid` + `aria-describedby` to each field and render `<FieldError>` under it.
   - "Next" button on each step runs the step-scoped parse; "Submit" on Step 4 runs the full parse. Toast shows a single "Please complete the highlighted fields" message; the gold rings + inline messages do the actual pointing.

6. **HTML-level enforcement**
   - Add `aria-required="true"` and `required` (where the native control supports it) to every required `<Input>` / select trigger. Keeps screen-reader + browser autofill semantics correct.

## Files

- `src/styles/theme-tokens.css` — extend `.careers-blue-field`, `.careers-gold-field`, `.jbj-blue-field`, `.jbj-gold-field`, `.careers-phone-input` with gold focus/invalid rings; add `.jbj-form-label[data-required]::after` gold asterisk.
- `src/components/forms/RequiredMark.tsx` (new) — shared marker, used internally by the label rule + standalone where needed.
- `src/components/forms/FieldError.tsx` (new) — inline gold error row.
- `src/pages/JoinApplication.tsx` — add `applicationSchema` (zod), `errors` state, per-step parsing in `goNext` and `handleSubmit`, wire `aria-invalid` + `<FieldError>` to every field, replace ad-hoc `*` spans with `data-required` on labels.
- `src/pages/CareersIntake.tsx` — same treatment, smaller schema.

## Out of scope

- No backend / RLS / edge-function changes.
- No copy rewrites beyond error messages.
- No layout/step restructuring; the existing 5-step wizard stays.
- Other JBJ forms (Inquiry, Chat, Concierge, PreJoin) are not touched in this pass — the token changes make them ready, but retrofitting is a separate task.
