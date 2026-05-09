## Goal
Make the E-Signature Dashboard scannable and searchable so the owner can instantly identify any agreement by client + property, and filter across the whole list.

## What's already working
Each envelope card already shows: doc number, status, client name (e.g. "Omar"), property context (type · building/community), masked phone/email, and template label. Search currently matches name + recipient name/email only.

## Changes (single file: `src/pages/e-signature/ESignatureDashboard.tsx`, plus tiny extension to `envelopeStatus.ts`)

### 1. Smarter free-text search
Extend the existing search box so it also matches:
- `landlord_name`, `mobile_number`, `email_address`, `passport_number`, `emirates_id`
- `property_type`, `building_name`, `community`, `street_name`, `unit_number`, `bedrooms`, `bathrooms`, `property_reference_no`
- `doc_number`
- The human template label ("Leasing" / "Selling")

So typing "Omar", "Marina", "3 bed", "leasing", or a doc number all hit the right form.

### 2. Filter bar (above the list, below stats)
Add compact filter controls — all client-side, no schema changes:

- **Type**: All / Leasing (Property Advertising Agreement) / Selling (Listing Authorisation) — dropdown, mapped from `template_key`.
- **Bedrooms**: All / Studio / 1 / 2 / 3 / 4 / 5+ — dropdown, matched against `template_field_values.bedrooms`.
- **Property type**: All / Villa / Apartment / Office / Warehouse — dropdown.
- **Location**: free-text input that matches `building_name | community | street_name`.
- **Nationality**: free-text input. We don't have a dedicated nationality field today, so it matches against `passport_number` country prefix and `additional_notes` for now, and we add an **optional** `nationality` field to the PAA & Listing Authorisation templates so future forms capture it cleanly. (Schema-only addition — keys default to "" so existing rows still work.)
- **Reset filters** button.

Active filters render as removable chips under the bar, mirroring the existing "Quick filter" status chips so the visual language stays consistent.

### 3. Card readability tweaks
- Show the **type label** as a small chip on the card (Leasing / Selling) so the user can tell apart a "JBJ Property Advertising Agreement" vs "Listing Authorisation" at a glance without reading the long name.
- Show **bedrooms · BUA** when present (e.g. "3 bed · 1,850 sqft"), right under the property line.
- Surface property reference no. when present, next to the doc number badge.

### 4. Empty / no-match states
Update the empty state copy so it tells the user which filters are active (e.g. "No leasing agreements match 'Omar' in Marina").

## Out of scope
- No backend / RLS changes.
- No edits to e-signature send flow, edge functions, or template HTML rendering.
- The `nationality` field is added as a schema key with a form input; we are not back-filling existing envelopes.

## Technical notes
- All filtering stays in `filteredEnvelopes` memoised over the existing query result.
- Template label + type chip resolved from `template_key` via a small `getTemplateKind(envelope)` helper added to `envelopeStatus.ts`.
- Bedroom matcher normalises "Studio" → 0 and accepts "5+".
