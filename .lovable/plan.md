## Root cause

The error visible in the preview toast is the smoking gun:

> "Could not find the 'metadata' column of 'esign_recipients' in the schema cache"

`useCreateEnvelopeFromTemplate` (in `src/hooks/useEsignTemplates.ts`) inserts into `esign_recipients` with a `metadata: { role: "owner" | "client" }` field, but **that column was never added to the table**. Migration `20260209063019` created `esign_recipients` with no `metadata` column, and no later migration adds one. The recipient INSERT therefore fails, the template-from-envelope mutation throws, no envelope row is committed in a usable state, no fields are written, and the navigation to `/e-signature/:id` never happens — which is exactly what the user reports: "preview not opening, fields not filled, envelope not created."

A second, related issue: even if creation succeeded, the dialog only collects client `name / email / phone`. None of those values are mapped into the template (`landlord_name`, `mobile_number`, `email_address`, etc.), so the generated PDF would still render with `PAA_DEFAULT_VALUES` placeholders — the user would still see "fields not filled."

## Fix plan

### 1. DB migration — add `metadata` to `esign_recipients`

New migration:

```sql
ALTER TABLE public.esign_recipients
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_esign_recipients_metadata_role
  ON public.esign_recipients ((metadata->>'role'));
```

This unblocks the recipient insert and the auto-generated `types.ts` will pick up the column.

### 2. Map client info into template values

In `useCreateEnvelopeFromTemplate`, build a `mergedValues` before rendering HTML:

```ts
const mergedValues = {
  landlord_name:  client?.name  ?? "",
  email_address:  client?.email ?? "",
  mobile_number:  client?.phone ?? "",
  ...values,
};
```

Pass `mergedValues` to both `buildSellingHtml` / `buildPAAHtml` and store in `template_field_values`. Result: at minimum the client identity fields render in the PDF instead of placeholders.

### 3. Expand the "Use template" dialog (`DocumentsFormsHub.tsx`)

Add an optional collapsible "Property details" section in the dialog that exposes the most important `PAA_FIELD_GROUPS` keys (property type, building, unit, community, BUA, bedrooms, bathrooms, sales/rent amount, listing period, exclusivity, dates). Bind each input to a local `values` state and forward to `createFromTpl.mutateAsync({ template, values, client })`. Defaults stay as today, so the dialog still works with just name+email if the user wants to skip the details.

### 4. Defensive guards

- In the mutation, after `supabase.storage.upload`, catch RLS upload errors with a clear toast.
- Wrap the recipient insert and field insert in a `try/catch` that, on failure, deletes the just-created envelope to avoid orphan drafts.
- Make sure navigation only fires after the mutation resolves successfully (already the case in the dialog).

### 5. Proof / verification

After the migration and code edits:

1. `supabase--read_query`: confirm `metadata` column exists on `esign_recipients`.
2. Open `/owner/documents/forms`, pick the Selling template, fill name/email/phone (and optionally a couple of property fields), click **Create Envelope**.
3. Confirm:
   - Toast shows "Draft created" (no schema-cache error).
   - Browser navigates to `/e-signature/<envelope_id>`.
   - `esign_envelopes` row exists with `template_field_values` containing the entered values.
   - `esign_recipients` has 2 rows (client, owner) with correct `metadata.role`.
   - `esign_fields` rows exist for each schema entry.
   - Generated PDF preview displays the client name / email / phone instead of `{{landlord_name}}` etc.
4. Open a sent draft and verify the **Preview** opens (currently failing because no envelope existed).

## Files to change

- New: `supabase/migrations/<ts>_add_metadata_to_esign_recipients.sql`
- Edit: `src/hooks/useEsignTemplates.ts` (merge client→template values, harden error path)
- Edit: `src/pages/owner/DocumentsFormsHub.tsx` (expand template dialog with optional property fields, pass `values`)

No edge-function changes are needed for this bug.
