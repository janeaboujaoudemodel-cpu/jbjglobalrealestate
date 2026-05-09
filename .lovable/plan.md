
## Goal

Make every CRM entity tab show its **own** content (no shared "CRM Network" duplicate header, no duplicate role tabs), wired to the real database table for that entity. Remove the on-page Insights block (it lives only in the toggle). Fix the Forms & Agreements hub so signed documents still appear in "Forms Generated" and the Omar test signature can be reverted to draft. Fix the PAA template (legal name dotting, office address from trade license, larger monogram in header/footer). Add a Deeds source column.

---

## 1. Per-entity CRM views — kill the duplicate "CRM Network" header

Today `UnifiedCRM` reuses `CRMNetwork` for Developers / Sales Reps / Agencies. That page renders its own `<h1>CRM Network</h1>` plus its own 5-tab role bar (Investors · Developers · Brokers · Agencies · Partners) — that is exactly the duplicated header the user sees.

Action — replace the embed with **dedicated, single-entity components** that share styling but render only their own table. New components under `src/components/crm/entity/`:

- `DevelopersDirectory.tsx` — sourced from `public.developers` (633 rows). Columns: logo · name · headquarters · license_number · website · CEO · projects (completed/offplan) · rank. Search across name/slug/headquarters. Click row → `CompanyHubDrawer` (type="developer", companyName=name).
- `BrokerageAgenciesDirectory.tsx` — sourced from `public.crm_brokerages` (10,613 rows), ordered with `sortBrokeragesForDirectory`. Columns: logo · company_name · emirate · country · office_location · phone · email · website · agent_count · rating · source · entry_source. Search across name/emirate/country. Click row → `CompanyHubDrawer` (type="brokerage").
- `DevSalesRepsDirectory.tsx` — sourced from `public.developer_sales_reps` joined to `developers(name, logo_url)`. Columns: full_name · title · developer · phone · email · whatsapp · is_primary. (Currently 0 rows; component must show an empty-state with an "Import" CTA pointing at the existing `developer_sales_contacts`/`developer_representatives` flow rather than fake data.)
- Each component gets its own `<SourceFilterChips>` instance scoped to its own rows so the country/source/database/team filter UX is preserved per tab — no cross-tab role bar.

Wire-up in `src/pages/owner/crm/UnifiedCRM.tsx`:

```text
entity = developers   →  <DevelopersDirectory />
entity = sales-reps   →  <DevSalesRepsDirectory />
entity = agencies     →  <BrokerageAgenciesDirectory />
entity = brokers      →  <BrokersRegistryPage />          (already correct)
entity = investors    →  <InvestorsDirectory … />          (already correct)
entity = leads/views  →  unchanged
```

`CRMNetwork.tsx` stays available at `/owner/crm/network` for the cross-relationship matrix view but is **no longer embedded** under any single-entity tab. Inside `CRMNetwork`, when `initialRole` is passed we hide its `<h1>` block and its role-tabs row to avoid the duplication if it is ever embedded again.

## 2. Remove on-page Insights block from main CRM screen

`UnifiedCRM` already has the Insights toggle in the title row, but the embedded entity views render separate "Overview/Insights" panels too. Action:

- Make the leads default view `all` (was `overview`) so the first thing the user sees on `/owner/crm` is the leads table.
- Keep "Overview" as a sub-view only inside the leads context bar (still reachable, just not default).
- Confirm `CRMEnhancedDashboard` is rendered **only** inside the collapsible Insights drawer and the explicit Overview view — not anywhere else.

## 3. Forms & Agreements hub — keep generated forms visible after signing; allow revert

In `src/pages/owner/DocumentsFormsHub.tsx`:

- Change bucketing so an envelope counts as **Forms Generated** whenever `isCompleteEnoughToBeGenerated(e)` is true, regardless of status (draft / sent / partially_signed / completed). The Pending and Signed tabs continue to show their own subset (sent/viewed/partially_signed → Pending; completed → Signed). Net effect: a generated form is **always** in Forms Generated, plus appears in Pending or Signed depending on lifecycle. This satisfies "always a form generated, even if it's signed, you need to keep it there."
- The bucket counts in the tab headers update accordingly so Omar's envelope shows ≥ 1 in Forms Generated.
- Add a per-row **"Mark as not signed (revert to draft)"** action visible only on completed envelopes in the Signed tab. It updates `esign_envelopes.status = 'draft'` and clears `signed_document_url`. AlertDialog confirms first ("This removes the signed copy and returns the form to drafts. Use only for test signatures."). After the revert, Omar will appear in Forms Generated as a draft and not in Signed.
- Empty-state copy on Forms Generated changes from "0 forms" to "No client-ready forms yet" (the count was misleading the user).

## 4. Property Advertising Agreement template — legal name, address, monogram

In `src/templates/jbjPropertyAdvertisingAgreement.ts` and `src/templates/jbjListingAuthorisation.ts`:

- Pull both `legalCompany` and the office-address line from a single new constant in `src/config/companyLegal.ts`:
  ```text
  TRADE_LICENSE_LEGAL_NAME  = "JBJ GLOBAL REAL ESTATE L.L.C - S.O.C"     // dotted, exactly as on the trade license
  TRADE_LICENSE_OFFICE      = "<the address printed on the trade license>"
  TRADE_LICENSE_NUMBER      = "<the license number>"
  ```
  Values come from the trade-license document on file. If the dotted spelling on the actual license differs from `L.L.C - S.O.C`, the constant is the only place to update — every PAA / Listing Authorisation header, footer, signature block and broker_appointee_name reads from it.
- Replace every hard-coded `"JBJ GLOBAL REAL ESTATE LLC - SOC"` and `"Downtown Dubai, UAE"` literal in the two template files with imports from this constant.
- Bump the header monogram size in the PAA template from its current ~44 px to **96 px tall** in `chrome-monogram-wordmark` and **80 px tall** in the footer band of the document so it reads as a proper letterhead crest, matching the on-screen `<BrandMonogram size="lg">` proportions. Wordmark next to it stays at `tracking-[0.22em]` uppercase Inter.
- Same constant is referenced by `src/components/Footer.tsx` corporate footer copy so the displayed legal name and address never drift from the trade license.

## 5. Deeds — show source column in CRM Documents

`src/integrations/supabase/types.ts` already exposes a `crm_documents` table used elsewhere; the existing Documents Hub lists deeds without a source. Action:

- Add a `source_label` column to the deeds list, computed as: `database_source` if present, else `upload_source`, else `"Uploaded via website form"` if the doc references a `forms_submissions.id`, else `"Manually uploaded"`.
- Display the source as a small champagne pill next to each deed row.
- No schema change required — uses existing fields. (If the deeds list is missing `database_source`/`upload_source`, the migration in step 6 covers it.)

## 6. Optional small migration

If `developer_sales_reps` is empty and the user wants real data, add a one-off backfill from `developer_sales_contacts` + `developer_representatives` (both currently 0). Skip until the user uploads sales-rep data.

## 7. Memory update

Refresh `mem://features/crm/unified-owner-hub-standard` to record:
- Per-entity dedicated components (no shared role-tab bar).
- Forms Generated includes signed envelopes; Signed has a revert-to-draft action.
- Legal name + office address come from `src/config/companyLegal.ts`, sourced from the trade license.

## Verification (manual, in preview)

1. `/owner/crm?entity=developers` shows Developers table (633 rows, columns above), no "CRM Network" h1, no role-tabs above the table.
2. `/owner/crm?entity=agencies` shows ~10,613 brokerage agencies with emirate/country/phone/email/office.
3. `/owner/crm?entity=sales-reps` shows the dedicated sales-reps table with empty-state CTA, not the cross-relationship view.
4. `/owner/crm` lands on Leads → All Leads. Insights only opens via the corner toggle.
5. Forms hub: Omar visible in Forms Generated AND in Signed. Click "Mark as not signed" → he disappears from Signed and stays in Forms Generated.
6. Generate a fresh PAA: header crest is large; legal name renders with dots from the trade license; address line shows the trade-license office, not "Downtown Dubai, UAE".
7. CRM Documents → deeds: each row shows a source pill (database / website form / manual).

## Out of scope

- No changes to `crm_leads`, RLS, or auth. No deletion of any existing component. `CRMNetwork.tsx` is preserved at its own route.
- No new database tables (only an optional config file + read-side bucketing changes + one revert-status mutation on `esign_envelopes`).

