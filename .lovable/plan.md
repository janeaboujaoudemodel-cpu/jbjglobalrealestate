## Plan

1. **Fix the import-blocking database constraint**
   - Update `crm_import_batches.default_expertise_type` so it accepts the newer broker categories currently used by the uploader: `sales`, `leasing_sales`, `developer_relations`, `event_attendees`, and `other`.
   - Keep existing allowed values (`leasing`, `selling`, `both`) so older data continues to work.
   - This directly resolves the current error: `crm_import_batches_default_expertise_type_check` rejecting `sales`.

2. **Make category mapping consistent end-to-end**
   - Update the upload dialog so “Sales” maps safely for both legacy fields and modern labels.
   - Keep `specialty_label` as the true category shown on broker cards/grid.
   - Ensure “Leasing + Sales” imports as both `leasing` and `sales`, not an invalid category.

3. **Fix drag-and-drop file upload**
   - Add real `dragOver`, `dragLeave`, and `drop` handlers to the upload zone.
   - Allow dropping multiple `.xlsx`, `.xls`, `.csv`, and `.tsv` files directly into the box.
   - Add clear visual feedback while dragging over the drop area.

4. **Improve “Add new / add more database” workflow**
   - Ensure the upload dialog can add more files after the first file is already loaded.
   - Reset the hidden file input after each selection so selecting the same file again works.
   - Keep existing metadata cards intact while appending additional databases.

5. **Harden import reliability for large files**
   - Improve error messages so constraint/import failures name the affected file and reason.
   - Keep the existing fast import path for large databases, but prevent a failed batch from leaving the UI stuck.
   - Refresh the broker registry after successful import so new database rows appear immediately.

6. **Validate the workflow**
   - Confirm the current failing payload with `default_expertise_type: "sales"` is accepted after the migration.
   - Test the upload dialog interaction logic locally through code-level checks and inspect the import request path.
   - Deploy any changed backend functions only if needed.

## Technical details

- Files expected to change:
  - `src/components/crm/BrokerBulkUploadDialog.tsx`
  - Possibly `src/lib/crm/brokerNormalize.ts`
  - A new database migration for the `crm_import_batches_default_expertise_type_check` constraint
- No existing import features will be removed.