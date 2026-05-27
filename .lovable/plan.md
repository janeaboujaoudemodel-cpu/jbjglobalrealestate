## Scope

Continuation of the signature/document polish, plus a major catalog upgrade to true RERA-compliant forms and a new Partnership family. Nothing is deleted — existing PAA flow and current "Forms & Contracts" hub stay live until you explicitly say to remove them.

---

## 1. Finish the previous turn

- Visually verify the per-page signature changes (Name → Signature → Date, label no longer wraps, typed name on the line, top-right "Generated …" date, recipient cell using legal-title heading, monogram 160px, stamp 180px) by rendering pages 1, 2, and last of the Holiday Home template and a Job Offer.
- Update `mem://documents/multi-page-signature-rule` to lock: order Name → Signature → Date, no dummy fallback, label column ≥96px, signature handwriting sits ON the line, top-right "Generated DD MONTH YYYY" stamp on every page, recipient cell heading uses `applicantLabel` (never "Recipient"/"Broker B"), monogram 160px, stamp 180px.

## 2. Form I — rebuild to the official RERA layout (from your BURJ_2.pdf)

Replace `composeFormI` in `src/templates/composers/reraForms.ts` with the 4-part structure:

- **PART 1 — THE PARTIES**: side-by-side table "A) THE AGENT/BROKER (Seller/Landlord)" vs "B) THE AGENT/BROKER (Buyer/Tenant)". Each side has: Name of Establishment · Address · Official Contact Details (PH/FAX/EMAIL/ORN/DED LISC/P.O. BOX) · The Registered Agent (NAME / BRN / DATE ISSUED / MOBILE / EMAIL / FORM A or FORM B STR#). Followed by the two RERA declaration blocks ("Declaration by Agent A" / "Declaration by Agent B") in their exact wording.
- **PART 2 — THE PROPERTY**: Property Address · Master Developer · Master Project Name · Building Name · Listed Price · Description · MOU exists? · Tenanted? · Maintenance fee/sq ft.
- **PART 3 — THE COMMISSION (SPLIT)**: total commission AED · Agent A % · Agent B % · Buyer/Tenant family name · Budget · Transfer fee paid by (Seller/Buyer/Negotiable) · Pre-finance approved? · Has buyer contacted Agent A?
- **PART 4 — THE SIGNATURES**: "Signature & Company Stamp of Agent A" and "Signature & Company Stamp of Agent B" cells, plus the standard RERA closing paragraph ("The Agent B is confirming to view… within 24 hours, Agent B must contact RERA.").

**JBJ side picker (your "Other" choice):** A new top-of-form select **"Which side is JBJ on this deal?"** with three options: *Agent A (Seller/Landlord)*, *Agent B (Buyer/Tenant)*, *None — fill both manually*. When a side is chosen, JBJ's establishment block auto-fills (name, address, phone, email, ORN, DED licence, P.O. Box from `companyLegal.ts`) AND the JBJ company stamp auto-renders inside that side's signature cell. The opposite side stays blank. Title at top of doc = **"AGENT to AGENT AGREEMENT"** with subtitle "As per the Real Estate Brokers By-Law No. (85) of 2006", and a "FORM I · BRN: 44750" eyebrow.

The legacy "Broker B" wording is removed everywhere.

## 3. Forms A, B, F — rebuild to true RERA layouts

Same upgrade pass on the other three:
- **Form A** — Contract Between Seller and Real Estate Broker (Seller/Landlord listing authorisation). Parts: Parties · Property · Listing Terms (price, commission %, exclusivity, duration) · Declarations · Signatures.
- **Form B** — Contract Between Buyer and Real Estate Broker. Parts: Parties · Search Brief (areas, budget, type, bedrooms, finance) · Commission Terms · Declarations · Signatures.
- **Form F** — Memorandum of Understanding (Sale Contract Buyer ↔ Seller). Parts: Parties (Seller, Buyer, both Brokers) · Property · Purchase Price & Deposit · Transfer fee split · MOU conditions · Signatures.

Each gets the same JBJ side-prefill behavior where applicable, auto-stamp, and the BRN/By-Law eyebrow.

Reference docs to align wording — pulled in the planning phase, not invented: official Dubai Land Department / RERA "Form A / Form B / Form F / Form I" templates.

## 4. Date behavior — locked rule

- **Every time a draft opens or is edited**, the document date renders as today's date in `DD MONTH YYYY` (no stale stored date).
- **On export**, the date inside the document is the export date — captured at the moment of PDF generation, not a previously saved value.
- The literal phrase "exported date" never appears. The date simply sits in the date field and in the top-right "Generated …" stamp.
- The `letterDate` / `ownerDate` / `applicantDate` saved values become *display fallbacks only* and are overridden on every open/export unless the user manually pins a date via a new "Lock date" toggle.

## 5. Merge PAA into Document Studio (non-destructive)

The standalone PAA flow (`src/templates/jbjPropertyAdvertisingAgreement.ts`, `PAAListingDraftCard`, `PAAAICopilotDrawer`, etc.) stays exactly where it is. In parallel:

- Add a new template id `paa_listing` to the **client** catalog in `documentCatalog.ts`, importing the same `PAA_DEFAULT_VALUES` / `PAAFieldKey` schema so all fields, AI copilot prompts, and field validation are identical.
- Wire the composer so Document Studio renders the PAA via the existing PAA HTML composer (no duplicate template — single source of truth).
- The PAA's "Generate with AI" copilot is exposed inside the Studio's existing AI side panel using the same instructions/system prompts as `PAAAICopilotDrawer`.
- A migration banner ("Now also available in Document Studio") is shown in the legacy PAA card so you can verify parity before asking us to remove the legacy entry.

## 6. New "Partners" template family + AI generator

New top-level group in the catalog called **"Partners"** with a premium gold-hairline section title. Clicking "Partners" opens a dropdown of partnership sub-templates:

1. **Referral Partner Agreement** — commission share per closed deal, attribution period, payment trigger, exclusivity scope.
2. **Marketing / Co-Branding Partner Agreement** — joint campaigns, logo usage, IP, term, kill-switch.
3. **Investor / Capital Partner Agreement** — capital commitment, profit-share %, project scope, distribution waterfall, exit.
4. **Strategic Brokerage Partner Agreement** — cross-market referrals, reciprocity, white-label, geographic territory.
5. **Other Partnership (custom)** — free-form, AI drafts from a short brief.

Each sub-template ships with the same RERA-grade layout (Parties · Recitals · Commercial Terms · Obligations · Confidentiality · Termination · Governing law · Signatures), JBJ auto-prefill on Party A, auto-stamp on the JBJ signature cell, and per-page Name/Signature/Date strip. The catalog audience is `client`.

**AI generator** ("Generate with AI" button at top of fields panel): sends partnership type + a short brief to the Lovable AI Gateway and returns a structured draft (recitals + clause list). Uses the existing Studio AI panel — no new edge function unless required for the partnership-specific system prompt; if so, a tiny `ai-draft-partnership` function will be added.

## 7. Verification & memory

- Render and screenshot Form I (both side-picker states), Form A, Form B, Form F, the merged PAA, and one Partnership template; confirm: JBJ side prefilled, opposite side empty, stamp visible, top-right "Generated …" date present, per-page signature compact and on-line, "Broker B" wording gone, no fake "Michael Anderson".
- Update `mem://documents/multi-page-signature-rule` and add a new `mem://documents/rera-forms-and-partners-standard` covering: official RERA 4-part layouts, JBJ side-picker auto-prefill + auto-stamp behavior, today/export date rule, PAA in Studio (legacy retained), Partners family + AI generator.

---

## Technical notes (skip if not relevant)

- Files touched: `src/templates/composers/reraForms.ts` (rewrite A/B/F/I), `src/templates/composers/index.ts` (router for partnership composers), new `src/templates/composers/partnersForms.ts` (5 partner composers), `src/config/documentCatalog.ts` (add `paa_listing`, `partner_*` ids, "Partners" group), `src/components/document-studio/DocumentStudio.tsx` (side-picker + group rendering + always-today date), `src/config/companyLegal.ts` (no schema change; consumed for JBJ prefill), `mem://documents/multi-page-signature-rule`, new `mem://documents/rera-forms-and-partners-standard`, `mem://index.md`.
- No DB migrations. PAA reuses existing `esign_envelopes.template_field_values` shape via shared `PAAFieldKey`.
- New `JBJ_PARTY_BLOCK_HTML` helper exported from `jbjLockedChrome.ts` so every RERA/partner composer prefills the JBJ side identically (single source of truth).