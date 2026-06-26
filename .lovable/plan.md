# Document Studio — Production Hardening Plan

This is a large, multi-area change. I'll execute in 6 sequenced phases and validate each with Playwright screenshots before moving on. No template/UI surface will be exposed unless its composer is wired end-to-end.

---

## Phase 1 — Shared Client Profile (single source of truth)

- New table `public.client_profiles` (per owner): `id, owner_id, full_name, passport_no, emirates_id, nationality, email, phone, address, position, salary, start_date, leads_from_date, extra jsonb, updated_at`.
- RLS: owner-only (`auth.uid() = owner_id`) + GRANTs for `authenticated` / `service_role`.
- New hook `useClientProfile(profileId)` — read/write, cached via React Query.
- DocumentStudio: when a template opens, fields hydrate from the linked `client_profile_id`. Editing any field writes back to the profile (debounced) so Offer / NDA / Employment / Warning / Commission / Termination all stay in sync.
- A "Client" picker at the top of Studio lets the user pick an existing profile or create one. Legacy per-template snapshots remain as a per-document override layer.

## Phase 2 — Auto-Companion NDA

- After a Job Offer is generated, auto-create a sibling NDA document bound to the same `client_profile_id`, pre-filled from the shared profile (Name, Passport, EID, Nationality, Email, Phone, Address, Position, Salary, Start Date, Leads-From Date).
- NDA composer (`case "nda"`) is upgraded from `composeGeneric` to a full structured composer matching offer chrome (header, watermark, signature block, working hours where relevant).
- "Offer / NDA" toggle in Studio already exists — wire it to the companion document id so switching is instant and edits in the shared profile reflect in both.
- Any template whose composer is still `composeGeneric`-stub will be hidden from the picker until it's promoted to a real composer.

## Phase 3 — Preview = PDF = Print parity

- Extract one render function `renderDocumentPages(snapshot): HTMLElement[]` used by:
  - Live preview iframe
  - PDF exporter (html2pdf/print-to-pdf path)
  - Browser print stylesheet (`@media print`)
- Lock A4 metrics in CSS variables (`--page-w:210mm; --page-h:297mm; --page-pad-*`); preview uses the same `mm` units, no `transform: scale` drift in export.
- Fonts: self-host Inter (woff2) and inline `@font-face` in the export HTML so PDF rendering matches preview exactly.
- Pagination: move from CSS column flow to an explicit per-page DOM (already partly there) so page breaks are byte-identical between preview and PDF.

## Phase 4 — Pre-export validation gate

New `validateDocument(snapshot): Issue[]` covers: overflow per page, cropped text (scrollHeight > pageHeight), empty placeholders (`[…]` / `{{…}}`), missing logo / monogram / footer, missing signature, missing stamp (when required), unfilled required vars, image load failures.

- "Download PDF" and "Print" buttons run validation first.
- Issues open a blocking dialog with jump-to-field links; export disabled until clean (or user clicks "Export anyway" with a warning, logged).

## Phase 5 — Print parity test harness

- Playwright script that, for every wired template:
  1. Opens preview, screenshots each page.
  2. Triggers PDF export, rasterises pages with pdftoppm, screenshots.
  3. Triggers browser print-to-PDF, rasterises, screenshots.
  4. Pixel-diffs Preview vs PDF vs Print; fails on >1% diff.
- Screenshots saved to `/tmp/doc-parity/` and surfaced in the final reply.

## Phase 6 — Template audit & UI hiding

- Inventory every `case` in `compose()` and classify as Real / Stub.
- Stubs (currently: anything that falls through to `composeGeneric` with only a title) are hidden from `DocumentStudioLauncher` until promoted.
- Required real-estate + HR set verified present:
  - HR: Job Offer, NDA, Employment Contract, Warning, Termination, Commission Agreement, Commission Invoice, Internship, HR Letter
  - RE: Form A, B, F, I, U, PAA, Tenancy Addendum, Holiday Home, Facility Mgmt
  - Partners: Referral, Marketing, Investor, Strategic, Custom
- Any missing template needed for production is added in this phase or explicitly listed as "not built — hidden".

---

## Technical notes

- New file: `supabase/migrations/<ts>_client_profiles.sql`
- New file: `src/hooks/useClientProfile.ts`
- New file: `src/lib/document-studio/validateDocument.ts`
- New file: `src/lib/document-studio/renderPages.ts` (shared render)
- New file: `src/templates/composers/nda.ts` (full NDA composer)
- Edits: `DocumentStudio.tsx`, `DocumentStudioLauncher.tsx`, `composers/index.ts`, export pipeline in `document-studio/export/`

## Out of scope

- E-signature / DocuSign flow changes (already a separate system).
- Visual restyle of templates — chrome, watermark, signature block, working hours all stay locked to current standard.

## Validation deliverable

At the end of each phase I'll attach Playwright screenshots (preview vs PDF vs print) for at least Job Offer + NDA + Employment Contract + Commission Agreement, plus the validation-gate dialog firing on a deliberately broken document.
