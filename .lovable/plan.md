## Status: System Is Already Built — One Editor Gap

The brokerage email template system you described **already exists end-to-end**:

- **Table** `crm_email_templates` is variant-keyed (`variant` is the primary key) with columns: `variant`, `subject`, `html`, `locked_at`, `locked_by`, `updated_at`, `updated_by`.
- **Seeded variants** (4 total): `brokerage_partnership_intro`, `brokerage_breakfast_invite`, `developer_registration`, `developer_confirm_registered`.
- **Edge function** `crm-send-brokerage-outreach` loads the locked HTML from `crm_email_templates`, renders `{{brokerage_name}}` / `{{contact_first_name}}` placeholders, and sends through the owner's connected Gmail so replies thread back to Jane.
- **Hooks** in `src/hooks/useCRMRelationships.ts`: `useSendBrokerageOutreach`, `useEmailTemplate(variant)`, `useUpsertEmailTemplate`, `useLockEmailTemplate`.
- **Bulk UI** `src/components/crm/BulkSendDialog.tsx` already exposes both brokerage variants with labels "Partnership intro · Private breakfast" and "Breakfast invitation · RSVP", wired into the Channel Partners tab in `CRMRelationships`.

### The only real gap

`TemplateEditorDialog` (the owner-side editor that lets Jane edit subject / HTML, preview, lock, and send a test) is hardcoded to `RegistrationVariant` (developer-only). The brokerage variants exist in the DB and can be sent, but there is no UI to edit or lock them. The hook `useUpsertEmailTemplate` is also typed `RegistrationVariant`.

## Plan

Extend the existing editor to cover brokerage templates — no new tables, no schema changes, no new send infrastructure.

### 1. Widen hook types (`src/hooks/useCRMRelationships.ts`)
- Change `useUpsertEmailTemplate` and `useLockEmailTemplate` parameter type from `RegistrationVariant` to `AnyEmailVariant`.
- No runtime change — they already write to the same table by `variant`.

### 2. Generalise `TemplateEditorDialog`
- Accept `initialVariant?: AnyEmailVariant` and `mode?: "developer" | "brokerage"` (default `developer`).
- Variant selector shows the matching pair:
  - developer → `developer_registration`, `developer_confirm_registered`
  - brokerage → `brokerage_partnership_intro`, `brokerage_breakfast_invite`
- Test-send branch: when mode is `brokerage`, call `useSendBrokerageOutreach` with `testRecipient` + `testBrokerageName`; otherwise keep `useSendDeveloperRegistration`.
- Placeholder hint chips switch to `{{brokerage_name}}`, `{{contact_first_name}}` in brokerage mode.

### 3. Wire editor into the Channel Partners tab
- In `src/pages/CRMRelationships.tsx`, add a second `TemplateEditorDialog` instance for brokerages, opened from a new "Edit brokerage templates" button placed next to the existing developer template button in the Channel Partners header.

### Out of scope (already working — do not touch)
- DB schema, RLS, seed rows
- `crm-send-brokerage-outreach` edge function
- `BulkSendDialog` brokerage flow
- Gmail threading / reply routing

### Files touched
- `src/hooks/useCRMRelationships.ts` (type widening, ~2 lines)
- `src/components/crm/TemplateEditorDialog.tsx` (mode prop + brokerage branch)
- `src/pages/CRMRelationships.tsx` (add editor button + dialog instance in Channel Partners tab)
