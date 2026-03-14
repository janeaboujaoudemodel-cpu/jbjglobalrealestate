

## Plan: Unified Document Generation System

### Current State

The platform has document tools scattered across multiple locations:

| Tool | Location | Access |
|------|----------|--------|
| **AI Document Generator** | `/ai-document-generator` (AIDocumentGeneratorPremium) | Auth-gated, public |
| **CV Resume Builder** | `/toolkit/corporate-suite/cv-resume` | Public toolkit |
| **Cover Letter Generator** | `/toolkit/corporate-suite/cover-letter` | Public toolkit |
| **Company Profile Builder** | `/toolkit/corporate-suite/company-profile` | Public toolkit |
| **Presentations** | `/presentations` | Public (any user) |
| **E-Signature** | `/e-signature/*` (5 pages) | Owner-only (OwnerGuard) |
| **Contract Reviewer** | `/e-signature/contract-review` | Owner-only |
| **Document Scanner** | `/toolkit/scan-sign` | Public toolkit |

E-signature system is fully built with `esign_envelopes`, `esign_recipients`, `esign_audit_log`, and `esign_signed_documents` tables.

### Implementation

#### Task 1: Public Document Hub (`/document-studio`)

Create a unified landing page that consolidates public document tools into one tabbed interface.

**New file: `src/pages/DocumentStudio.tsx`**
- Tabbed hub with sections:
  - **Generate** — Embeds `AIDocumentGeneratorPremium` (listing, email, SMS, social, brochure, newsletter, client report)
  - **CV & Resume** — Links to existing `/toolkit/corporate-suite/cv-resume`
  - **Cover Letter** — Links to existing `/toolkit/corporate-suite/cover-letter`
  - **Company Profile** — Links to existing `/toolkit/corporate-suite/company-profile`
  - **Presentations** — Links to existing `/presentations`
- Each tab either embeds the component inline or navigates to the existing route
- Premium black/gold styling consistent with the platform

**Route:** Add `/document-studio` to `PublicRoutes.tsx` as an `AuthRequiredRoute`.

#### Task 2: JBJ Exclusive Documents (Owner-Only)

Create an owner-exclusive document hub for contracts, NDAs, HR letters, and RERA forms.

**New file: `src/pages/owner/ExclusiveDocuments.tsx`**
- Categorized grid of document templates:
  - **Contracts**: Offer Letter, Employment Contract, Commission Agreement, MOU
  - **HR Letters**: Recommendation Letter, Termination Letter, Salary Certificate, NOC
  - **Legal**: NDA, Non-Compete, Vendor Agreement
  - **RERA Forms**: Form F, Form A, Form B, Form I
- Each template card opens a generation modal/form with pre-filled template fields
- Output integrates with existing stamp (`DocumentStampIntegration`) and e-signature (`DocumentESignIntegration`) modules
- Protected by `OwnerGuard`

**Route:** Add `/owner/exclusive-documents` to `AdminRoutes.tsx` wrapped in `OwnerGuard`.

#### Task 3: AI Prompt Contract Generation

Add a free-form AI prompt mode to the Exclusive Documents page.

**Changes to `src/pages/owner/ExclusiveDocuments.tsx`:**
- Add an "AI Generate" tab with a single large `Textarea` prompt input
- Example placeholder: *"Generate an offer letter for John Smith with 20% commission, start date 1 April 2026"*
- Document type auto-detected from prompt, or user picks from dropdown
- Calls existing `ai-document-generator` edge function with `documentType: "contract-prompt"` and the raw prompt as `details`
- Output rendered in an editable preview with copy/download/sign actions

**Edge function update (`supabase/functions/ai-document-generator/index.ts`):**
- Add handling for `documentType: "contract-prompt"` — passes the raw prompt directly to the AI with a system prompt tuned for legal/HR document generation
- Restrict this document type to owner-only by checking `auth.uid()` against owner verification

#### Task 4: E-Signature Integration for Clients

The e-signature system already exists and works (envelopes, recipients, signing flow). The public signing route `/sign/:token` is already in `StandaloneRoutes.tsx`. 

**Changes needed:**
- **Link from generated documents to e-signature**: Add a "Send for Signature" button on both Document Studio and Exclusive Documents output panels that navigates to `/e-signature/create` with the generated document pre-loaded
- **In `ExclusiveDocuments.tsx`**: After generating a contract/letter, show a prominent "Send for E-Signature" CTA that passes the generated content to `CreateEnvelope`
- **In `DocumentStudio.tsx`**: Add a secondary "Sign" button on generation results (links to `/e-signature/create`)
- **Route state passing**: Use `navigate('/e-signature/create', { state: { prefillDocument: generatedContent, documentName: title } })` and update `CreateEnvelope.tsx` to accept and pre-fill from `location.state`

**Update `src/pages/e-signature/CreateEnvelope.tsx`:**
- Read `location.state.prefillDocument` on mount
- If present, auto-populate the document content/name fields

### Files Summary

| File | Change |
|------|--------|
| **New**: `src/pages/DocumentStudio.tsx` | Public unified document hub with tabs |
| **New**: `src/pages/owner/ExclusiveDocuments.tsx` | Owner-only contracts, NDA, HR letters, RERA forms with AI prompt mode |
| `src/routes/PublicRoutes.tsx` | Add `/document-studio` route |
| `src/routes/AdminRoutes.tsx` | Add `/owner/exclusive-documents` route |
| `src/pages/e-signature/CreateEnvelope.tsx` | Accept prefill from navigation state |
| `supabase/functions/ai-document-generator/index.ts` | Add `contract-prompt` document type handling |

### Implementation Order
1. Create `DocumentStudio.tsx` public hub (Task 1)
2. Create `ExclusiveDocuments.tsx` owner hub with template grid (Task 2)
3. Add AI prompt generation mode to exclusive hub (Task 3)
4. Wire e-signature integration and prefill flow (Task 4)
5. Add routes to both route files

