## Goal

Restore and upgrade the "Generate Document" experience that used to live at `/owner/job-offer-template`, then promote it into a **single unified Document Studio engine** that powers two separate template catalogs:

- **Careers Portal → Contracts & Templates** — staff/employee docs (Job Offer, Employment Contract, Warning Letter, NDA, Commission Agreement, Internship, HR Letter, Partnership / Referral, Custom).
- **Forms & Contracts (Client hub)** — client docs only (Form A / Form F / Form I, PAA, leasing addendums, etc.).

Both catalogs use **the same engine, the same locked premium header/footer, the same branded-email send pipeline, the same test-email flow**. Only the *template list* and *recipient context* differ.

---

## What's wrong today

1. **Sub-header on `/owner/careers-portal` doesn't scroll horizontally** on this viewport — the active "Contracts & Templates" tab can be reached but the row clips. The previous "Generate Job Offer" CTA that used to sit in this section is also missing.
2. The Contracts tab only shows `JobOfferManager` — an "Add Template" CRUD on `hr_job_offers` (upload a PDF + metadata). It cannot *generate* a document.
3. The real generator (`src/pages/JobOfferTemplate.tsx`) still exists but is orphaned — `/owner/job-offer-template` now just redirects back into the contracts tab, so the feature appears lost.
4. Client-side `ContractForms` page exists but isn't wired to the same engine, branded-email pipeline, or test-email flow used by the Careers/Relationship-Hub email composer.

---

## Plan

### 1. Fix the Contracts tab header (UI)

- Make `CareersTabRow` reliably horizontally scrollable on narrow viewports (overflow-x scroller already exists; restore proper `min-w-max` on the inner list and ensure the active-tab `scrollIntoView` lands on the right column without clipping).
- Add a primary action **"Generate Document"** (gold-hairline navy CTA) at the top of the Contracts tab, parallel to the existing "Add Template" button. "Add Template" stays (it's metadata/upload CRUD); the new button opens the Studio.

### 2. Build the unified engine: `DocumentStudio`

New shared component `src/components/document-studio/DocumentStudio.tsx` driven by a single prop `catalog: "staff" | "client"`.

Layout (full-screen dialog or routed view, same look in both contexts):

```text
┌──────────────────────────────────────────────────────────┐
│  LOCKED PREMIUM HEADER (champagne band + gold hairline)  │  ← never editable
├───────────────┬───────────────────────────┬──────────────┤
│ 1. Template   │  2. Editable Body         │ 3. AI Chat   │
│    picker     │     (AI-generated HTML,   │   "tell me   │
│ + position    │      DOMPurified,         │   how to     │
│   picker      │      contentEditable)     │   change it" │
│ + dynamic     │                           │              │
│   fields      │                           │              │
├───────────────┴───────────────────────────┴──────────────┤
│  LOCKED PREMIUM FOOTER (NAP, RERA, hairline)             │  ← never editable
└──────────────────────────────────────────────────────────┘
        [ Generate ] [ Preview ] [ Send via Branded Email ]
                                  [ Send Test to me ]
```

Behavior:

- **Step 1 — Pick template kind.** Pulled from a single registry `src/config/documentCatalog.ts`:
  - `staff` catalog: Job Offer, Employment Contract, Warning Letter, NDA, Commission Agreement, Internship Agreement, HR Letter, Partnership/Referral Agreement, Custom Letter. Selecting "Job Offer" / "Warning Letter" / etc. **reveals the position picker** (departments + open positions from `hr_job_offers` + `open_positions`).
  - `client` catalog: Form A, Form F, Form I, PAA (Property Advertising Agreement), Tenancy Addendum, Custom Client Letter. No position picker — instead a **client picker** (CRM contact lookup) appears.
- **Step 2 — Dynamic fields.** Each catalog entry declares its required fields (recipient name, ID/passport, salary, start date, RERA #, property reference, etc.). Form is auto-rendered from the schema.
- **Step 3 — Generate.** Calls the existing `letter-ai-generate` edge function (already wired for the Blank Letter Studio) with a `documentType` + `templateData` payload. Returns HTML, sanitized with DOMPurify, injected into the editable body. Header/footer come from a constant React chrome — the AI never sees or returns them.
- **Live AI Chat (right panel).** Persistent thread that gets the current body HTML + the user's instruction (e.g., "make the salary AED 30k, add a 90-day probation clause"). Streams updated HTML via `ai-chat-stream`, diff is applied to the body. Header/footer remain locked.
- **Premium chrome is locked.** Stored in `src/templates/jbjLockedChrome.ts` (header band + footer block). Rendered outside the editable region. Print/PDF/email exports always wrap the body with this chrome.

### 3. Wire to the branded email + auto-send pipeline

Reuse what already exists — do not rebuild:

- `BrandedEmailComposer` + `useEmailTemplateLibrary` for the email shell.
- `compose-branded-email` edge function to render the email HTML with brand colors.
- `documents-send` for attaching the generated document (PDF render of the chrome+body).
- `send-application-status-email` for the staff "offer_sent" automated trigger that the CV Center / Approvals already fire.

From the Studio, "Send via Branded Email" opens the existing `BrandedEmailComposer` pre-filled with: recipient (from step 2), subject (from catalog entry), email body (branded shell + "Please find attached your {{documentType}}"), attachment (generated PDF). "Send Test to me" reuses the same composer with the test recipient (per project rule: `infoo.jane@gmail.com` for the owner's own tests).

### 4. Mount the engine in both hubs

- **Careers Portal → Contracts tab**: replace the current single `<JobOfferManager />` with a two-pane view:
  - Top: `<DocumentStudioLauncher catalog="staff" />` (the "Generate Document" CTA + recently generated list)
  - Below: existing `<JobOfferManager />` (Add Template CRUD — kept, not deleted, per the No-Removal policy)
- **Client hub `/contract-forms`**: add the same launcher with `catalog="client"`. The existing form-A/F/I download flow stays as a quick-pick, but the "Generate" button opens the Studio with that template pre-selected.

### 5. Catalog separation rule (locked)

`documentCatalog.ts` is the single source of truth. Each entry is tagged `audience: "staff" | "client"`. The Studio filters by its `catalog` prop. A staff entry can never appear in the client hub and vice versa. This is the only place future template types are added.

---

## Files touched

**New**
- `src/config/documentCatalog.ts` — registry of all template kinds + their field schemas + audience.
- `src/templates/jbjLockedChrome.ts` — locked premium header/footer HTML constants.
- `src/components/document-studio/DocumentStudio.tsx` — engine (template picker, dynamic form, editable body, locked chrome wrapper, AI chat panel, generate/send buttons).
- `src/components/document-studio/DocumentStudioLauncher.tsx` — small launcher card (CTA + recent docs) embedded into hubs.
- `src/components/document-studio/AiEditChatPanel.tsx` — right-side live AI editor.

**Edited**
- `src/pages/owner/CareersPortal.tsx` — wire launcher above `JobOfferManager` in the contracts section; fix `CareersTabRow` scroll on narrow viewports.
- `src/pages/ContractForms.tsx` — mount `<DocumentStudioLauncher catalog="client" />`.
- `src/routes/AdminRoutes.tsx` — keep `/owner/job-offer-template` redirect to the contracts tab (no change) but ensure the contracts tab actually shows the Studio launcher.

**Reused as-is (no edits)**
- `supabase/functions/letter-ai-generate` — generation.
- `supabase/functions/ai-chat-stream` — live AI edit chat.
- `supabase/functions/compose-branded-email`, `documents-send`, `send-application-status-email` — sending.
- `src/components/crm/BrandedEmailComposer.tsx`, `src/hooks/useEmailTemplateLibrary.ts`, `src/components/hr/JobOfferManager.tsx` — kept.

No DB migrations. No new edge functions. Everything plugs into existing infrastructure.

---

## Technical notes

- **Locked chrome enforcement**: the editable body is a separate `contentEditable` div nested *inside* a non-editable wrapper containing the chrome. AI prompts include `Never include <header>, <footer>, company NAP, or signature blocks — those are appended by the system.` Any returned HTML containing forbidden tags is stripped server-side before being shown.
- **PDF export**: client-side `html2canvas` + `jsPDF` (already used elsewhere in the project for CRM exports) wraps `chromeHeaderHtml + bodyHtml + chromeFooterHtml`.
- **AI chat panel**: maintains its own message array, sends `{ currentHtml, instruction }` per turn; response replaces the body in-place. Header/footer never go over the wire.
- **Audience guard**: `DocumentStudio` throws at mount if a template entry's `audience` doesn't match the `catalog` prop — prevents accidental cross-leak of staff docs into the client hub.
- **Header scroll fix**: `CareersTabRow`'s inner flex needs `min-w-max` and the scroller needs `overflow-x: auto; scroll-snap-type: x proximity;` so all 16 tabs are reachable on 1159px viewports.

---

## Out of scope (for this pass)

- Versioning / approval workflow for generated documents (already partially covered by `ApprovalWorkflowPanel` — can be wired in a follow-up).
- E-signature handoff (`esign-send-for-signature` exists; can be added to the Studio's action row in a follow-up).
- Multi-language template variants.