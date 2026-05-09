## 1. PAA Edit → Document sync (single source of truth)

**Problem:** Fields edited in the Property Advertising Agreement edit panel don't appear in the rendered document. Some fields shown in the Edit form are not actually rendered by the template HTML.

**Fix:**
- Treat `PAA_FIELD_GROUPS` (in `src/templates/jbjPropertyAdvertisingAgreement.ts`) as the single source of truth — the Edit form already iterates over it; the template HTML must render *every* key from it.
- Audit the template `renderTemplateHtml` body in `jbjPropertyAdvertisingAgreement.ts`. For every `PAAFieldKey` that is **not** currently emitted (e.g. `passport_number`, `emirates_id`, `nationality`, `listing_consultant`, `property_reference_no`, `expiry_date`, `furnishing`, `vacating_date`, `street_name`, `community`, `bua_sqft`, `plot_sqft`, `parking`, `additional_notes`, `broker_appointee_name`, `listing_period_until_date`), add a `fieldUnderline(...)` cell in the appropriate section block so edited values flow into the PDF.
- Force render with `force: true` for fields the user explicitly edits, so newly added values aren't suppressed by the "hide if empty" rule on first save.
- Add a `keys → label` lookup so any future field added to `PAA_FIELD_GROUPS` automatically renders via a fallback "Additional Details" block (prevents this drift recurring).
- After save, the edit panel already calls `regenerate.mutateAsync` and `refetch()`. Add a cache-bust query string on `document_url` (`?v=${updated_at}`) so the iframe refreshes even when the storage URL is reused.
- Standard template parity: the same `PAA_FIELD_GROUPS` already drives both the "Use template" creation dialog (`DocumentsFormsHub`) and the Edit panel (`EnvelopeDetail`). Confirm this is the only schema and remove any drift.

**Files**
- `src/templates/jbjPropertyAdvertisingAgreement.ts` — extend rendered HTML to cover all field keys; add fallback group.
- `src/pages/e-signature/EnvelopeDetail.tsx` — cache-bust the iframe `src` after regenerate; pass `force` flag for edited keys.

## 2. CRM premium two-tier navigation

**Problem:** The header shows entity tabs (Leads, Investors, Developers…), and immediately under it a second flat row repeats with sub-section pills (All Leads, Overview, Flagged, VIP, Lead Mgmt, Tasks…). It reads as a duplicate header.

**Fix in `src/pages/owner/crm/UnifiedCRM.tsx`:**
- Keep the entity bar as the single primary tab row (Leads, Investors, Developers, Sales Reps, Brokers, Agencies, Employees) — segmented control style, champagne-on-cream with a 1px gold hairline under the active tab.
- Replace the wrapping context-bar pill row with a **premium left-rail sub-navigation** that appears only when an entity has multiple views (today: Leads + Brokers):
  - Desktop: a fixed 200px champagne sidebar inside the body card, listing sub-sections vertically with section label "Leads · Sub-sections" (e.g. Overview / All / Flagged / VIP / Lead Mgmt / Tasks / Calendar / Notes / Inbox / Notifications / Contracts / Campaigns / Automation).
  - Mobile / narrow: collapse to a single labelled `<select>` ("Sub-section ▾") so it never wraps into a second header row.
- Group leads sub-sections visually: People (All / Overview / Flagged / VIP / Mgmt) · Workspace (Tasks / Calendar / Notes / Inbox / Notifications) · Pipeline (Contracts / Campaigns / Automation) — single-letter capsule labels removed; clear typographic hierarchy with 10px uppercase group headers.
- Active sub-section uses `EFE6D6` cream surface + ink text + 1px gold hairline left-border (no gold fill).
- Default view for Leads remains "All Leads"; URL state stays `?entity=&view=`.

**No removal:** every existing view stays accessible — only its presentation changes.

## Out of scope
- No DB migrations, no edge function changes.
- Existing PAA chrome studio, signing flow, recipients, and CC manager untouched.

## Acceptance
- Editing any field in PAA Edit panel and pressing Save updates the visible PDF on the same screen within one render cycle.
- CRM page shows exactly one row of primary tabs at the top; sub-sections live in a left rail (desktop) or dropdown (mobile), never as a second top-row.
