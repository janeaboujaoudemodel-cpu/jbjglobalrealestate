# Brokerage Outreach: Drop Drive URL, Add Citi Project Picker

## Goal
For brokerage emails, replace the Google Drive link with a **City Developer e-catalogue project picker**, default to **AMRA** (current focus), and surface the **Allura tactical promo** (2 × 1BR, 15% discount, 100% upfront) when Allura is selected. Developer registration emails keep the Drive link unchanged.

## Current state (verified)
- `crm-send-brokerage-outreach` builds `varsMap` with no project fields — only `brokerage_name`, `contact_*`, `group_status_*`, `booking_url`, etc.
- `crm-send-developer-registration` already injects `drive_url` from `crm_owner_settings.drive_doc_pack_url`. Stays as-is.
- `TemplateEditorDialog` brokerage placeholder hint shows only `brokerage_name` + `contact_first_name`. Drive URL appears only in developer mode (line 99/142).
- `crm_email_templates` rows exist for both brokerage variants but are **not locked** → safe to re-seed.
- `BrokerageOutreachPersonalization` carries `groupStatus` + `preferredSlotId`. Needs a new `featuredProjectKey`.
- `BulkSendDialog` already has bulk + per-row personalization UI for group status / preferred slot.

## Plan

### 1. New config — `src/config/citi-projects.ts`
Single source of truth: 5 projects (AMRA, Allura, Aveline, Agua, Arya) with `name`, `url` (e-catalogue), `tagline`, optional `offerHtml`. AMRA flagged `isFocus: true`. Allura `offerHtml` describes the 2×1BR / 15% / 100% upfront promo. Default = `amra`.

### 2. Type extension — `src/hooks/useCRMRelationships.ts`
Add `featuredProjectKey?: CitiProjectKey` to `BrokerageOutreachPersonalization`.

### 3. Edge function — `supabase/functions/crm-send-brokerage-outreach/index.ts`
- Inline the project catalogue (Deno can't import from `src/`).
- Resolve `featuredProjectKey` from `personalization` (default `amra`).
- Add to `varsMap`: `project_name`, `project_url`, `project_tagline`, `project_offer_html`.
- Update fallback HTML (when stored template lacks `{{represented_developer_name}}`) to include the project section instead of any Drive link.

### 4. Re-seed brokerage templates
SQL update on `crm_email_templates` for `brokerage_partnership_intro` and `brokerage_breakfast_invite`. Both templates use:
- `{{contact_first_name}}`, `{{brokerage_name}}`, `{{group_status_line}}`
- A clear **Featured Project** card with `{{project_name}}`, `{{project_tagline}}`, a CTA button to `{{project_url}}`
- `{{#if project_offer_html}} … {{/if}}` block to inject the Allura promo (or any future project's tactical offer)
- Private breakfast & briefing CTA (`{{booking_url}}`)
- A short paragraph asking them to confirm whether they're already registered with us

No `{{drive_url}}` anywhere in brokerage variants.

### 5. UI — `src/components/crm/TemplateEditorDialog.tsx`
- For brokerage mode only: change placeholder hint to list `{{brokerage_name}}`, `{{contact_first_name}}`, `{{project_name}}`, `{{project_url}}`, `{{project_offer_html}}`.
- Update preview replacement: drop the `drive_url` substitution from the brokerage branch (it was already only in the developer branch — verify), add substitutions for the new project vars using the AMRA defaults so previews render correctly.
- Developer mode unchanged.

### 6. UI — `src/components/crm/BulkSendDialog.tsx`
- Add a **Featured project** select (bulk-level + per-row override) shown only for `entityType === "brokerage"`. Options pulled from `CITI_PROJECT_LIST`. Default = AMRA.
- Pipe `featuredProjectKey` through `resolvePersonalization()`.
- Extend `previewVars` with `project_name`, `project_url`, `project_tagline`, `project_offer_html` so the in-dialog preview reflects the choice.

### 7. Acceptance
- Brokerage email preview shows AMRA card + e-catalogue button by default; switching to Allura adds the 2×1BR / 15% / 100% upfront block.
- No Drive URL appears in any brokerage send.
- Developer registration emails are unchanged.
- Test send works for both brokerage variants with project selected.

## Files to create
- `src/config/citi-projects.ts`

## Files to edit
- `src/hooks/useCRMRelationships.ts` — add `featuredProjectKey` to personalization type
- `supabase/functions/crm-send-brokerage-outreach/index.ts` — resolve project vars, update fallback HTML
- `src/components/crm/TemplateEditorDialog.tsx` — placeholder hint + preview vars (brokerage only)
- `src/components/crm/BulkSendDialog.tsx` — project picker (bulk + per-row), preview vars

## Database change (data, not schema)
- Update two rows in `crm_email_templates` (variants `brokerage_partnership_intro`, `brokerage_breakfast_invite`) with the new HTML/subject. Both rows are unlocked.

## Out of scope
- No change to developer registration templates or `drive_url` flow.
- No change to breakfast slot booking, registration check, or NDA logic.
- No new tables; project catalogue is a static config (curated, low churn).
